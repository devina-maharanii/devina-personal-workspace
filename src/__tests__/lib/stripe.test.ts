import { describe, it, expect, vi } from "vitest";
import { PLANS, getPlanByPriceId } from "@/lib/stripe";

// Mock env validation so stripe.ts can be imported without real env vars
vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_PRO_PRICE_ID: "price_pro_placeholder",
    STRIPE_ENTERPRISE_PRICE_ID: "price_enterprise_placeholder",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_placeholder",
  },
}));



describe("PLANS constant", () => {
  it("has FREE, PRO, and ENTERPRISE tiers", () => {
    expect(PLANS).toHaveProperty("FREE");
    expect(PLANS).toHaveProperty("PRO");
    expect(PLANS).toHaveProperty("ENTERPRISE");
  });

  it("FREE plan has price 0 and correct limits", () => {
    expect(PLANS.FREE.price).toBe(0);
    expect(PLANS.FREE.limits.aiCredits).toBe(50);
    expect(PLANS.FREE.limits.members).toBe(1);
  });

  it("PRO plan has correct aiCredits and member limits", () => {
    expect(PLANS.PRO.limits.aiCredits).toBe(1000);
    expect(PLANS.PRO.limits.members).toBe(5);
    expect(PLANS.PRO.price).toBe(29);
  });

  it("ENTERPRISE plan has the highest limits", () => {
    expect(PLANS.ENTERPRISE.limits.aiCredits).toBe(10000);
    expect(PLANS.ENTERPRISE.limits.members).toBe(50);
    expect(PLANS.ENTERPRISE.price).toBe(99);
  });

  it("all plans have required shape", () => {
    for (const [, plan] of Object.entries(PLANS)) {
      expect(plan).toHaveProperty("id");
      expect(plan).toHaveProperty("name");
      expect(plan).toHaveProperty("price");
      expect(plan).toHaveProperty("features");
      expect(plan.features.length).toBeGreaterThan(0);
      expect(plan).toHaveProperty("limits.aiCredits");
      expect(plan).toHaveProperty("limits.members");
      expect(plan).toHaveProperty("limits.storage");
    }
  });
});

describe("getPlanByPriceId", () => {
  it("returns FREE plan for empty string", () => {
    expect(getPlanByPriceId("")).toEqual(PLANS.FREE);
  });

  it("returns FREE plan for unknown priceId", () => {
    expect(getPlanByPriceId("price_unknown_xyz")).toEqual(PLANS.FREE);
  });

  it("returns PRO plan for PRO priceId", () => {
    expect(getPlanByPriceId(PLANS.PRO.priceId)).toEqual(PLANS.PRO);
  });

  it("returns PRO plan for PRO annual priceId placeholder", () => {
    expect(getPlanByPriceId("price_1ProPlanAnnual_Placeholder")).toEqual(PLANS.PRO);
  });

  it("returns ENTERPRISE plan for ENTERPRISE priceId", () => {
    expect(getPlanByPriceId(PLANS.ENTERPRISE.priceId)).toEqual(PLANS.ENTERPRISE);
  });

  it("returns ENTERPRISE plan for ENTERPRISE annual priceId placeholder", () => {
    expect(getPlanByPriceId("price_1EnterprisePlanAnnual_Placeholder")).toEqual(
      PLANS.ENTERPRISE,
    );
  });
});
