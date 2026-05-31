import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { withRateLimit, stripeLimiter, getClientIp } from "@/lib/rateLimit";

/**
 * POST creates a Stripe Customer Portal Session for billing configuration.
 */
async function handler() {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Enforce customer registry existence
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing profile found. Please purchase a plan first." },
        { status: 400 }
      );
    }

    // 3. Create Stripe Billing Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withRateLimit(
  stripeLimiter,
  async () => {
    const user = await getCurrentUser();
    return user ? `api-stripe-portal-${user.id}` : `api-stripe-portal-anon-${await getClientIp()}`;
  },
  handler
);

