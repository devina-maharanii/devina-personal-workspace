import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, verifyApiKey } from "../src/lib/crypto";

describe("Cryptographic Helpers", () => {
  it("should generate keys with specified prefix", () => {
    const key = generateApiKey("test");
    expect(key.startsWith("test_")).toBe(true);
    expect(key.length).toBeGreaterThan(32);
  });

  it("should hash keys securely and verify them", () => {
    const key = "sample_api_key_string";
    const hash = hashApiKey(key);
    expect(hash).not.toBe(key);
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it("should verify keys securely", () => {
    const key = generateApiKey("sec");
    const hash = hashApiKey(key);
    
    expect(verifyApiKey(key, hash)).toBe(true);
    expect(verifyApiKey("wrong_key", hash)).toBe(false);
  });
});
