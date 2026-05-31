import { test, expect } from "@playwright/test";

/**
 * E2E: AI Chat flow
 *
 * Verifies AI pages are behind auth and API endpoints reject
 * unauthenticated requests.
 */

test.describe("AI Chat Flow", () => {
  test("unauthenticated /ai page redirects to sign-in", async ({ page }) => {
    await page.goto("/ai");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated /ai/chat redirects to sign-in", async ({ page }) => {
    await page.goto("/ai/chat");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("AI chat API rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/ai/chat", {
      data: { messages: [{ role: "user", content: "Hello" }] },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("AI generate API rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.post("/api/ai", {
      data: { prompt: "Say hello" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("AI tools API rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/ai/tools", {
      data: { type: "summarize", content: "test" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });
});
