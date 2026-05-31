import { test, expect } from "@playwright/test";

/**
 * E2E: Authentication flow
 *
 * In E2E_TEST_MODE the middleware redirects protected routes to /sign-in
 * without needing real Clerk keys. Public pages may return 500 when DB/Redis
 * are not configured — that is acceptable in local test mode.
 */

test.describe("Authentication Flow", () => {
  test("sign-up page is reachable", async ({ page }) => {
    await page.goto("/sign-up");
    // Should stay on sign-up (not redirect to an error page)
    await expect(page).toHaveURL(/sign-up/);
  });

  test("sign-in page is reachable", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated visit to /dashboard redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated visit to /admin redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated visit to /ai redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/ai");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated visit to /settings redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("root page (/) does not redirect to sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("pricing page does not redirect to sign-in", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("blog page does not redirect to sign-in", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});
