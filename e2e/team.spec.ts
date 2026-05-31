import { test, expect } from "@playwright/test";

/**
 * E2E: Team / Invitation flow
 *
 * Verifies team and settings pages are behind auth, APIs reject
 * unauthenticated requests, and public invite pages are accessible.
 */

test.describe("Team Invitation Flow", () => {
  test("unauthenticated visit to /team redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/team");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated visit to /settings/organization redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/settings/organization");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("invite token page is publicly accessible (not redirected to sign-in)", async ({
    page,
  }) => {
    await page.goto("/invite/some-test-token-abc123");
    // Invite page is public — should NOT redirect to sign-in
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("user profile API rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.get("/api/user/me");
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("notifications API rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.get("/api/notifications");
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("search API rejects unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/search?q=test");
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("SSE endpoint rejects unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/sse");
    expect([401, 403, 307, 500]).toContain(response.status());
  });
});
