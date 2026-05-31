import { env } from "./env";

export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    description: "Perfect for testing and small hobby projects.",
    price: 0,
    priceId: "",
    priceIdAnnual: "",
    limits: {
      aiCredits: 50,
      members: 1,
      storage: "1GB",
      storageBytes: 1 * 1024 * 1024 * 1024,
    },
    features: [
      "50 AI credits per month",
      "Basic text generation model",
      "Standard email support",
      "Single project seat",
      "1GB media storage",
    ],
  },
  PRO: {
    id: "pro",
    name: "Pro",
    description: "For professionals needing unlimited scale.",
    price: 29,
    priceId: env.STRIPE_PRO_PRICE_ID || "price_1ProPlan_Placeholder",
    priceIdAnnual: env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_1ProPlanAnnual_Placeholder",
    limits: {
      aiCredits: 1000,
      members: 5,
      storage: "10GB",
      storageBytes: 10 * 1024 * 1024 * 1024,
    },
    features: [
      "1,000 AI credits per month",
      "Access to advanced Gemini 1.5 Pro model",
      "Priority 24/7 support",
      "Up to 5 project seats",
      "10GB media storage",
      "Custom domain support",
    ],
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large scale organizations.",
    price: 99,
    priceId: env.STRIPE_ENTERPRISE_PRICE_ID || "price_1EnterprisePlan_Placeholder",
    priceIdAnnual: env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || "price_1EnterprisePlanAnnual_Placeholder",
    limits: {
      aiCredits: 10000,
      members: 50,
      storage: "100GB",
      storageBytes: 100 * 1024 * 1024 * 1024,
    },
    features: [
      "10,000 AI credits per month",
      "Dedicated custom models & fine-tuning",
      "Dedicated account manager",
      "Up to 50 project seats",
      "100GB media storage",
      "Custom integrations & webhooks",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const PLAN_LIMITS = {
  FREE: PLANS.FREE.limits,
  PRO: PLANS.PRO.limits,
  ENTERPRISE: PLANS.ENTERPRISE.limits,
} as const;

export const getPlanByPriceId = (priceId: string) => {
  if (
    priceId === PLANS.PRO.priceId ||
    priceId === PLANS.PRO.priceIdAnnual ||
    priceId === "price_1ProPlanAnnual_Placeholder"
  ) {
    return PLANS.PRO;
  }
  if (
    priceId === PLANS.ENTERPRISE.priceId ||
    priceId === PLANS.ENTERPRISE.priceIdAnnual ||
    priceId === "price_1EnterprisePlanAnnual_Placeholder"
  ) {
    return PLANS.ENTERPRISE;
  }
  return PLANS.FREE;
};
