import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_PRO_PRICE_ID: "price_pro_test",
    STRIPE_ENTERPRISE_PRICE_ID: "price_enterprise_test",
    STRIPE_PRO_ANNUAL_PRICE_ID: "price_pro_annual_test",
    STRIPE_ENTERPRISE_ANNUAL_PRICE_ID: "price_enterprise_annual_test",
  },
}));

import { PLANS, PLAN_LIMITS, getPlanByPriceId } from "@/lib/plans";

// ─── PLANS shape ──────────────────────────────────────────────────────────────

describe("PLANS", () => {
  it("exports FREE, PRO, and ENTERPRISE tiers", () => {
    expect(PLANS).toHaveProperty("FREE");
    expect(PLANS).toHaveProperty("PRO");
    expect(PLANS).toHaveProperty("ENTERPRISE");
  });

  it("FREE plan is free and has correct limits", () => {
    expect(PLANS.FREE.price).toBe(0);
    expect(PLANS.FREE.priceId).toBe("");
    expect(PLANS.FREE.limits.aiCredits).toBe(50);
    expect(PLANS.FREE.limits.members).toBe(1);
  });

  it("PRO plan has correct price and limits", () => {
    expect(PLANS.PRO.price).toBe(29);
    expect(PLANS.PRO.limits.aiCredits).toBe(1000);
    expect(PLANS.PRO.limits.members).toBe(5);
  });

  it("ENTERPRISE plan has the highest limits", () => {
    expect(PLANS.ENTERPRISE.price).toBe(99);
    expect(PLANS.ENTERPRISE.limits.aiCredits).toBe(10000);
    expect(PLANS.ENTERPRISE.limits.members).toBe(50);
  });

  it("every plan has a non-empty features array", () => {
    for (const plan of Object.values(PLANS)) {
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it("storageBytes is consistent with storage string label", () => {
    expect(PLANS.FREE.limits.storageBytes).toBe(1 * 1024 * 1024 * 1024);
    expect(PLANS.PRO.limits.storageBytes).toBe(10 * 1024 * 1024 * 1024);
    expect(PLANS.ENTERPRISE.limits.storageBytes).toBe(100 * 1024 * 1024 * 1024);
  });

  it("PRO priceId comes from env", () => {
    expect(PLANS.PRO.priceId).toBe("price_pro_test");
  });

  it("ENTERPRISE priceId comes from env", () => {
    expect(PLANS.ENTERPRISE.priceId).toBe("price_enterprise_test");
  });

  it("PRO annual priceId comes from env", () => {
    expect(PLANS.PRO.priceIdAnnual).toBe("price_pro_annual_test");
  });

  it("ENTERPRISE annual priceId comes from env", () => {
    expect(PLANS.ENTERPRISE.priceIdAnnual).toBe("price_enterprise_annual_test");
  });
});

// ─── PLAN_LIMITS ──────────────────────────────────────────────────────────────

describe("PLAN_LIMITS", () => {
  it("mirrors PLANS limits for all tiers", () => {
    expect(PLAN_LIMITS.FREE).toEqual(PLANS.FREE.limits);
    expect(PLAN_LIMITS.PRO).toEqual(PLANS.PRO.limits);
    expect(PLAN_LIMITS.ENTERPRISE).toEqual(PLANS.ENTERPRISE.limits);
  });
});

// ─── getPlanByPriceId ─────────────────────────────────────────────────────────

describe("getPlanByPriceId", () => {
  it("returns FREE for empty string", () => {
    expect(getPlanByPriceId("")).toEqual(PLANS.FREE);
  });

  it("returns FREE for unknown priceId", () => {
    expect(getPlanByPriceId("price_unknown_xyz")).toEqual(PLANS.FREE);
  });

  it("returns PRO for PRO monthly priceId", () => {
    expect(getPlanByPriceId("price_pro_test")).toEqual(PLANS.PRO);
  });

  it("returns PRO for PRO annual priceId", () => {
    expect(getPlanByPriceId("price_pro_annual_test")).toEqual(PLANS.PRO);
  });

  it("returns PRO for PRO annual placeholder", () => {
    expect(getPlanByPriceId("price_1ProPlanAnnual_Placeholder")).toEqual(PLANS.PRO);
  });

  it("returns ENTERPRISE for ENTERPRISE monthly priceId", () => {
    expect(getPlanByPriceId("price_enterprise_test")).toEqual(PLANS.ENTERPRISE);
  });

  it("returns ENTERPRISE for ENTERPRISE annual priceId", () => {
    expect(getPlanByPriceId("price_enterprise_annual_test")).toEqual(PLANS.ENTERPRISE);
  });

  it("returns ENTERPRISE for ENTERPRISE annual placeholder", () => {
    expect(getPlanByPriceId("price_1EnterprisePlanAnnual_Placeholder")).toEqual(
      PLANS.ENTERPRISE,
    );
  });
});
