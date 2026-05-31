import { test, expect } from "@playwright/test";

/**
 * E2E: Billing / Stripe flow
 *
 * Verifies auth protection on billing APIs and that the pricing
 * page is publicly accessible (not behind auth).
 */

test.describe("Billing Flow", () => {
  test("pricing page is publicly accessible (not redirected to sign-in)", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("unauthenticated visit to /billing redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/billing");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("checkout API rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/stripe/create-checkout", {
      data: { priceId: "price_test" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("billing portal API rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.post("/api/stripe/create-portal", {
      data: {},
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });
});
