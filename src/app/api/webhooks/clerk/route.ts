import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole, SubscriptionStatus } from "@prisma/client";
import { sendTransactionalEmail } from "@/lib/resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { captureEvent } from "@/lib/posthog";
import { ANALYTICS_EVENTS } from "@/lib/constants";
import { withRateLimit, apiLimiter, getClientIp } from "@/lib/rateLimit";

/**
 * POST processes incoming webhook payloads from Clerk.
 * Authenticates the headers using Svix signature verification.
 * Events handled:
 * - user.created: Inserts profile and queues for async Stripe registration.
 * - user.updated: Synchronizes profile properties.
 * - user.deleted: Performs a soft-delete, marking deletedAt and canceling tier.
 */
async function handler(req: Request) {
  // Clerk sends custom headers for validation
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET in environment variables");
    return new Response("Webhook secret not set", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const body = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred during verification", {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (!id) {
    return new Response("Error: Missing user ID", { status: 400 });
  }

  try {
    if (eventType === "user.created") {
      const { email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses[0]?.email_address;

      if (!primaryEmail) {
        return new Response("Error: Missing email address", { status: 400 });
      }

      // Create or update user (idempotent upsert to avoid race conditions with JIT auth sync)
      const user = await db.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email: primaryEmail,
          name: `${first_name || ""} ${last_name || ""}`.trim() || null,
          avatarUrl: image_url || null,
          role: UserRole.USER,
          needsStripeCustomer: true, // Queued for async Stripe customer generation
        },
        update: {
          email: primaryEmail,
          name: `${first_name || ""} ${last_name || ""}`.trim() || null,
          avatarUrl: image_url || null,
        },
      });

      // Dispatch welcome email asynchronously
      const userName = user.name || "there";
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.saasplatform.com"}/dashboard`;
      
      sendTransactionalEmail(primaryEmail, "Welcome to Antigravity!", WelcomeEmail, {
        name: userName,
        dashboardUrl,
      }).catch((emailErr) => {
        console.error("Failed to send welcome email in webhook:", emailErr);
      });

      // Track sign up in PostHog
      captureEvent(id, ANALYTICS_EVENTS.USER_SIGNED_UP, {
        plan: "free",
      });

      return new Response("User created and queued for Stripe customer generation successfully", { status: 201 });
    }

    if (eventType === "user.updated") {
      const { email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses[0]?.email_address;

      await db.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail,
          name: `${first_name || ""} ${last_name || ""}`.trim() || null,
          avatarUrl: image_url || null,
        },
      });

      return new Response("User updated successfully", { status: 200 });
    }

    if (eventType === "session.created") {
      const { user_id } = evt.data;
      if (user_id) {
        captureEvent(user_id as string, ANALYTICS_EVENTS.USER_SIGNED_IN);
      }
      return new Response("Session tracked successfully", { status: 200 });
    }

    if (eventType === "user.deleted") {
      // Soft-delete user: mark deletedAt timestamp & cancel billing tier
      await db.user.update({
        where: { clerkId: id },
        data: {
          deletedAt: new Date(),
          subscriptionStatus: SubscriptionStatus.CANCELED,
        },
      });

      return new Response("User soft-deleted successfully", { status: 200 });
    }

    return new Response("Event ignored", { status: 200 });
  } catch (error) {
    console.error("Error processing Clerk webhook:", error);
    return new Response("Database write failed", { status: 500 });
  }
}

export const POST = withRateLimit(
  apiLimiter,
  async () => {
    return `api-clerk-webhook-${await getClientIp()}`;
  },
  handler
);
