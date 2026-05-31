import { describe, it, expect } from "vitest";
import { isValidClerkKey } from "@/lib/clerk-key";

describe("isValidClerkKey", () => {
  it("should return false for undefined or empty keys", () => {
    expect(isValidClerkKey(undefined)).toBe(false);
    expect(isValidClerkKey("")).toBe(false);
    expect(isValidClerkKey('""')).toBe(false);
  });

  it("should return false for dummy / placeholder keys", () => {
    expect(isValidClerkKey("pk_test_...")).toBe(false);
    expect(isValidClerkKey('"pk_test_..."')).toBe(false);
    expect(isValidClerkKey("pk_test_1234567890abcdef")).toBe(false);
    expect(isValidClerkKey("pk_test_placeholder")).toBe(false);
  });

  it("should return false for keys without a dollar sign", () => {
    expect(isValidClerkKey("pk_test_randomwithoutdollar")).toBe(false);
    expect(isValidClerkKey("pk_live_randomwithoutdollar")).toBe(false);
  });

  it("should return false for keys not starting with pk_test_ or pk_live_", () => {
    expect(isValidClerkKey("sk_test_12345$abcdef")).toBe(false);
    expect(isValidClerkKey("random_12345$abcdef")).toBe(false);
  });

  it("should return true for valid Clerk publishable keys containing dollar sign", () => {
    expect(isValidClerkKey("pk_test_Y2xlcmsuY29tJG15LWFwcC05Mi5jbGVyay5hY2NvdW50cy5kZXYk")).toBe(true);
    expect(isValidClerkKey("pk_live_YWNhZGVteS5jbGVyay5kZXYkYW5vdGhlcndvcmQ=")).toBe(true);
    expect(isValidClerkKey('"pk_test_Y2xlcmsuY29tJG15LWFwcC05Mi5jbGVyay5hY2NvdW50cy5kZXYk"')).toBe(true); // Should strip quotes
  });
});
