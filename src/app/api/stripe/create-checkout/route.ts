import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";
import { captureEvent } from "@/lib/posthog";
import { ANALYTICS_EVENTS } from "@/lib/constants";
import { withRateLimit, stripeLimiter, getClientIp } from "@/lib/rateLimit";

/**
 * POST creates a Stripe Checkout Session for subscription checkout.
 * Body Parameters:
 * - priceId: The target Stripe Price ID.
 * - organizationId: Optional ID for multi-tenant mapping.
 */
async function handler(req: Request) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request parameters
    const body = await req.json().catch(() => null);
    const priceId = typeof body?.priceId === "string" ? body.priceId : "";
    const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId parameter" }, { status: 400 });
    }

    if (organizationId) {
      const membership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Invalid organizationId" }, { status: 400 });
      }
    }

    // Validate the plan exists and is a paid tier (cannot purchase "free" tier)
    const plan = getPlanByPriceId(priceId);
    if (plan.id === "free") {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Resolve real price ID if placeholder is used
    let resolvedPriceId = priceId;
    if (priceId === "price_1ProPlan_Placeholder") {
      resolvedPriceId = plan.priceId || priceId;
    } else if (priceId === "price_1ProPlanAnnual_Placeholder") {
      resolvedPriceId = plan.priceIdAnnual || priceId;
    } else if (priceId === "price_1EnterprisePlan_Placeholder") {
      resolvedPriceId = plan.priceId || priceId;
    } else if (priceId === "price_1EnterprisePlanAnnual_Placeholder") {
      resolvedPriceId = plan.priceIdAnnual || priceId;
    }

    // 3. Resolve or create Stripe customer id
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create Stripe customer on-demand if missing in DB
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Sync customer details back to the user
      await db.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: customer.id,
          needsStripeCustomer: false,
        },
      });
    }

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: user.id,
          organizationId: organizationId || "",
        },
      },
      metadata: {
        userId: user.id,
        organizationId: organizationId || "",
      },
      allow_promotion_codes: true,
    });

    captureEvent(user.id, ANALYTICS_EVENTS.CHECKOUT_STARTED, {
      plan: resolvedPriceId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating stripe checkout session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withRateLimit(
  stripeLimiter,
  async () => {
    const user = await getCurrentUser();
    return user ? `api-stripe-checkout-${user.id}` : `api-stripe-checkout-anon-${await getClientIp()}`;
  },
  handler
);
