import Stripe from "stripe";
import { env } from "./env";
import { loadStripe } from "@stripe/stripe-js";
import { PLANS, PlanKey, getPlanByPriceId } from "./plans";

export { PLANS, getPlanByPriceId };
export type { PlanKey };

/**
 * Server-side Stripe client singleton configuration.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});

let stripePromise: ReturnType<typeof loadStripe> | null = null;

/**
 * Client-side Stripe loader singleton function.
 */
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};
