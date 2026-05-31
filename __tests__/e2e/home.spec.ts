import { test, expect } from "@playwright/test";

test.describe("Landing Page E2E", () => {
  test("should load and display hero text successfully", async ({ page }) => {
    // Navigate to local server root url
    await page.goto("/");

    // Verify main landing title is present
    await expect(page.locator("h1")).toContainText("Build SaaS Applications");

    // Verify navigation links are visible
    await expect(page.locator("text=Pricing")).toBeVisible();
    await expect(page.locator("text=Blog")).toBeVisible();
  });
});
