import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import Stripe from "stripe";
import { SubscriptionStatus, Prisma } from "@prisma/client";
import { createNotification } from "@/lib/notifications";
import { captureEvent } from "@/lib/posthog";
import { ANALYTICS_EVENTS } from "@/lib/constants";
import { sendTransactionalEmail } from "@/lib/resend";
import { SubscriptionConfirmEmail } from "@/emails/SubscriptionConfirmEmail";
import { getPlanByPriceId } from "@/lib/plans";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";
import { triggerWebhook } from "@/lib/webhooks";
import { writeAuditLog } from "@/lib/audit";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";

// Disable Next.js route body parsing to allow Stripe signature verification
export const dynamic = "force-dynamic";

function getSubscriptionStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "trialing":
      return "TRIALING";
    default:
      return "FREE";
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const signature = headerPayload.get("Stripe-Signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);
    return new Response("Webhook verification failed", { status: 400 });
  }

  // 1. Enforce Webhook Idempotency by registering in database
  let dbEvent = await db.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (dbEvent?.processed) {
    return new Response("Webhook already processed", { status: 200 });
  }

  const eventData: Prisma.InputJsonValue = JSON.parse(JSON.stringify(event.data.object));

  if (!dbEvent) {
    dbEvent = await db.webhookEvent.create({
      data: {
        type: event.type,
        stripeEventId: event.id,
        processed: false,
        data: eventData,
      },
    });
  }

  try {
    // 2. Process webhook events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string | null;
      if (!subscriptionId) {
        return new Response("Missing subscription on checkout session", { status: 400 });
      }
      const subscription = (await stripe.subscriptions.retrieve(
        subscriptionId
      )) as Stripe.Subscription;

      const customerId = typeof session.customer === "string" ? session.customer : "";
      if (!customerId) {
        return new Response("Missing customer on checkout session", { status: 400 });
      }
      const priceId = subscription.items.data[0]?.price?.id;
      if (!priceId) {
        return new Response("Missing price on subscription", { status: 400 });
      }

      // Find user via trusted metadata (set during checkout creation)
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("Missing userId metadata on checkout.session.completed");
        return new Response("Missing userId metadata", { status: 400 });
      }

      const user = await db.user.findUnique({ where: { id: userId } });

      if (!user) {
        console.warn(`Stripe checkout completed for unknown user: ${userId}`);
        return new Response("User not found — acknowledged", { status: 200 });
      }

      const subscriptionPeriodEndValue = (
        subscription as Stripe.Response<Stripe.Subscription> & { current_period_end?: number }
      ).current_period_end;
      if (typeof subscriptionPeriodEndValue !== "number") {
        return new Response("Missing subscription period end", { status: 400 });
      }
      const subscriptionPeriodEnd = subscriptionPeriodEndValue;
      await db.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          subscriptionStatus: getSubscriptionStatus(subscription.status),
          currentPeriodEnd: new Date(subscriptionPeriodEnd * 1000),
          needsStripeCustomer: false,
        },
      });

      await invalidateCache(CACHE_KEYS.userProfile(user.clerkId));

      // Track checkout completion / upgrade
      captureEvent(user.id, ANALYTICS_EVENTS.SUBSCRIPTION_UPGRADED, {
        to_plan: priceId,
      });

      // Write audit log
      await writeAuditLog({
        userId: user.id,
        action: `Stripe Checkout completed: Upgraded to ${priceId}`,
        targetType: "Subscription",
        targetId: subscription.id,
        metadata: { priceId, customerId }
      });
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id;
      if (!priceId) {
        return new Response("Missing price on subscription", { status: 400 });
      }

      const user = await db.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!user) {
        console.warn(`Stripe subscription updated received for unknown user subscription: ${subscription.id}`);
        return new Response("Subscription not found — acknowledged", { status: 200 });
      }

      const subscriptionPeriodEnd = (subscription as Stripe.Subscription & { current_period_end: number }).current_period_end;
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: getSubscriptionStatus(subscription.status),
          currentPeriodEnd: new Date(subscriptionPeriodEnd * 1000),
          stripePriceId: priceId,
        },
        include: { memberships: true },
      });

      await invalidateCache(CACHE_KEYS.userProfile(user.clerkId));

      if (updatedUser) {
        await writeAuditLog({
          userId: updatedUser.id,
          action: `Stripe Subscription updated: Status changed to ${subscription.status}`,
          targetType: "Subscription",
          targetId: subscription.id,
          metadata: { priceId, status: subscription.status }
        });

        await Promise.all(
          updatedUser.memberships.map((membership) =>
            triggerWebhook(membership.organizationId, "subscription.updated", {
              userId: updatedUser.id,
              status: subscription.status,
              priceId,
            })
          )
        );
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const user = await db.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!user) {
        console.warn(`Stripe subscription deleted received for unknown user subscription: ${subscription.id}`);
        return new Response("Subscription not found — acknowledged", { status: 200 });
      }

      // Downgrade user back to FREE plan status
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: SubscriptionStatus.CANCELED,
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
        include: { memberships: true },
      });

      await invalidateCache(CACHE_KEYS.userProfile(user.clerkId));

      if (updatedUser) {
        await writeAuditLog({
          userId: updatedUser.id,
          action: `Stripe Subscription deleted: Downgraded to FREE`,
          targetType: "Subscription",
          targetId: subscription.id,
          metadata: { previousSubscriptionId: subscription.id }
        });

        await Promise.all(
          updatedUser.memberships.map((membership) =>
            triggerWebhook(membership.organizationId, "subscription.canceled", {
              userId: updatedUser.id,
            })
          )
        );

        await createNotification({
          userId: updatedUser.id,
          title: "Subscription Cancelled",
          message: "Your subscription has been cancelled. Your account has been reverted to the Free plan tier.",
          type: "warning",
          link: "/billing",
          category: "billing",
        });

        // Track cancellation
        captureEvent(updatedUser.id, ANALYTICS_EVENTS.SUBSCRIPTION_CANCELED);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = invoice.customer as string;

      const user = await db.user.findUnique({
        where: { stripeCustomerId },
      });

      if (user) {
        // Flag subscription as PAST_DUE
        await db.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: SubscriptionStatus.PAST_DUE,
          },
        });

        await invalidateCache(CACHE_KEYS.userProfile(user.clerkId));

        // Send payment failure warning email via Resend
        const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const amountDueFormatted = invoice.amount_due ? `$${(invoice.amount_due / 100).toFixed(2)}` : "$29.00";

        const plan = getPlanByPriceId(user.stripePriceId || "");
        const planName = plan.name + " Tier";

        await sendTransactionalEmail(
          user.email,
          "Warning: Your payment for Antigravity AI failed",
          PaymentFailedEmail,
          {
            name: user.name || "there",
            planName,
            amount: amountDueFormatted,
            updateBillingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.saasplatform.com"}/billing`,
            gracePeriodEnd,
          }
        );

        // Log in-app warning notification
        await createNotification({
          userId: user.id,
          title: "Payment Failed",
          message: "Warning: Your subscription payment failed. Please update billing credentials to maintain access.",
          type: "error",
          link: "/billing",
          category: "billing",
        });

        // Write audit log
        const subscriptionRef = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
        const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
        await writeAuditLog({
          userId: user.id,
          action: `Stripe Payment failed: Subscription PAST_DUE`,
          targetType: "Subscription",
          targetId: subscriptionId,
          metadata: { amountDue: invoice.amount_due }
        });
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = invoice.customer as string;

      const user = await db.user.findUnique({
        where: { stripeCustomerId },
      });

      if (user) {
        // Send email receipt
        const amountPaidFormatted = invoice.amount_paid ? `$${(invoice.amount_paid / 100).toFixed(2)}` : "$29.00";
        const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        const plan = getPlanByPriceId(user.stripePriceId || "");
        const planName = plan.name + " Plan";
        const price = `$${plan.price}.00/mo`;
        const features = [...plan.features];

        await sendTransactionalEmail(
          user.email,
          "Subscription Confirmed! - Antigravity",
          SubscriptionConfirmEmail,
          {
            name: user.name || "there",
            planName,
            price,
            amountPaid: amountPaidFormatted,
            nextBillingDate,
            features,
          }
        );

        // Log in-app success notification
        await createNotification({
          userId: user.id,
          title: "Subscription Renewed Successfully",
          message: "Success! Your subscription has been renewed and credits have been credited.",
          type: "success",
          link: "/billing",
          category: "billing",
        });

        // Write audit log
        const subscriptionRef = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
        const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
        await writeAuditLog({
          userId: user.id,
          action: `Stripe Payment succeeded: Subscription renewed`,
          targetType: "Subscription",
          targetId: subscriptionId,
          metadata: { amountPaid: invoice.amount_paid }
        });
      }
    }

    // Mark event processed to guarantee idempotency
    await db.webhookEvent.update({
      where: { id: dbEvent.id },
      data: { processed: true },
    });

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return new Response("Webhook processing database write failed", { status: 500 });
  }
}
