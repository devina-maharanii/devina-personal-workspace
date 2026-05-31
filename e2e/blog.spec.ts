import { test, expect } from "@playwright/test";

/**
 * E2E: Blog flow
 *
 * Verifies public blog routes are accessible (not behind auth)
 * and admin blog routes are protected.
 */

test.describe("Blog Flow", () => {
  test("public blog listing page is not redirected to sign-in", async ({
    page,
  }) => {
    await page.goto("/blog");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("blog search query param does not redirect to sign-in", async ({
    page,
  }) => {
    await page.goto("/blog?q=nextjs");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("non-existent blog post does not redirect to sign-in", async ({
    page,
  }) => {
    await page.goto("/blog/this-post-does-not-exist-xyz-abc");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("admin blog list redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/admin/blog");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("admin blog edit page redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/admin/blog/some-id/edit");
    await expect(page).toHaveURL(/sign-in/);
  });
});
