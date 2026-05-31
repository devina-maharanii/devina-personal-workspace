import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import type Stripe from "stripe";
import { sendTransactionalEmail } from "@/lib/resend";
import { SubscriptionExpiringEmail } from "@/emails/SubscriptionExpiringEmail";
import { createNotification } from "@/lib/notifications";
import { triggerWebhook } from "@/lib/webhooks";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function getSubscriptionStatus(status: string) {
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

export async function GET(request: Request) {
  try {
    // 1. Authorize CRON request (using case-insensitive authorization check)
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      emailsSent: 0,
      downgraded: 0,
      synced: 0,
    };

    // 2. Subscriptions expiring in exactly 7 days → send reminder email
    const sevenDaysFromNowStart = new Date();
    sevenDaysFromNowStart.setDate(sevenDaysFromNowStart.getDate() + 7);
    sevenDaysFromNowStart.setHours(0, 0, 0, 0);

    const sevenDaysFromNowEnd = new Date();
    sevenDaysFromNowEnd.setDate(sevenDaysFromNowEnd.getDate() + 7);
    sevenDaysFromNowEnd.setHours(23, 59, 59, 999);

    const expiringUsers = await db.user.findMany({
      where: {
        subscriptionStatus: { in: ["ACTIVE", "TRIALING"] },
        currentPeriodEnd: {
          gte: sevenDaysFromNowStart,
          lte: sevenDaysFromNowEnd,
        },
        deletedAt: null,
      },
    });

    for (const user of expiringUsers) {
      if (!user.email) continue;
      const plan = getPlanByPriceId(user.stripePriceId || "");

      await sendTransactionalEmail(
        user.email,
        `Subscription Alert: Renewal or Expiration in 7 Days`,
        SubscriptionExpiringEmail,
        {
          name: user.name || "there",
          planName: plan.name,
          expiryDate: user.currentPeriodEnd ? user.currentPeriodEnd.toLocaleDateString() : "in 7 days",
          billingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings/billing`,
        }
      ).catch((err) => {
        console.error(`Failed to send expiration email to ${user.email}:`, err);
      });

      await writeAuditLog({
        userId: user.id,
        action: "subscription.expiring_reminder_sent",
        targetType: "SUBSCRIPTION",
        targetId: user.stripeSubscriptionId,
        metadata: {
          email: user.email,
          expiryDate: user.currentPeriodEnd,
          planName: plan.name,
        }
      });

      results.emailsSent++;
    }

    // 3. PAST_DUE subscriptions > 7 days → downgrade to FREE
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueUsers = await db.user.findMany({
      where: {
        subscriptionStatus: "PAST_DUE",
        currentPeriodEnd: {
          lt: sevenDaysAgo,
        },
        deletedAt: null,
      },
      include: {
        memberships: true,
      },
    });

    for (const user of overdueUsers) {
      const originalSubId = user.stripeSubscriptionId;
      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "FREE",
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });

      await writeAuditLog({
        userId: user.id,
        action: "subscription.overdue_downgraded",
        targetType: "SUBSCRIPTION",
        targetId: originalSubId,
        metadata: {
          previousStatus: "PAST_DUE",
          newStatus: "FREE",
          overdueSince: user.currentPeriodEnd,
        }
      });

      // Dispatch real-time organization webhook alerts
      await Promise.all(
        user.memberships.map((m) =>
          triggerWebhook(m.organizationId, "subscription.canceled", {
            userId: user.id,
          }).catch((err) => console.error("Webhook trigger failed during subscription downgrade:", err))
        )
      );

      // Create in-app system notifications
      await createNotification({
        userId: user.id,
        title: "Subscription Terminated",
        message: "Your subscription payment was overdue for more than 7 days, so your account has been downgraded to the Free tier.",
        type: "error",
        link: "/dashboard/settings/billing",
        category: "billing",
      }).catch((err) => {
        console.error(`Failed to trigger in-app notification for downgraded user ${user.id}:`, err);
      });

      results.downgraded++;
    }

    // 4. Sync Active Stripe subscription statuses
    const activeSubUsers = await db.user.findMany({
      where: {
        stripeSubscriptionId: { not: null },
        deletedAt: null,
      },
    });

    for (const user of activeSubUsers) {
      try {
         
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId!);
        const stripeStatus = getSubscriptionStatus(subscription.status);
        const stripePriceId = subscription.items.data[0]?.price.id || null;
        const currentPeriodEndTimestamp = (
          subscription as Stripe.Response<Stripe.Subscription> & { current_period_end?: number }
        ).current_period_end;
        if (typeof currentPeriodEndTimestamp !== "number") {
          console.warn("Stripe subscription missing current_period_end:", user.stripeSubscriptionId);
          continue;
        }
        const currentPeriodEnd = new Date(currentPeriodEndTimestamp * 1000);

        if (
          user.subscriptionStatus !== stripeStatus ||
          user.stripePriceId !== stripePriceId ||
          !user.currentPeriodEnd ||
          Math.abs(user.currentPeriodEnd.getTime() - currentPeriodEnd.getTime()) > 5000
        ) {
          await db.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: stripeStatus,
              stripePriceId,
              currentPeriodEnd,
            },
          });

          await writeAuditLog({
            userId: user.id,
            action: "subscription.stripe_sync",
            targetType: "SUBSCRIPTION",
            targetId: user.stripeSubscriptionId,
            metadata: {
              previousStatus: user.subscriptionStatus,
              newStatus: stripeStatus,
              previousPriceId: user.stripePriceId,
              newPriceId: stripePriceId,
              previousCurrentPeriodEnd: user.currentPeriodEnd,
              newCurrentPeriodEnd: currentPeriodEnd,
            }
          });

          results.synced++;
        }
       
      } catch (stripeErr: unknown) {
        console.error(`Stripe status sync failed for user ${user.id} subscription ${user.stripeSubscriptionId}:`, stripeErr);
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
   
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Cron check-subscriptions failed:", error);
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}
