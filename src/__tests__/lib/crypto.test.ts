import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  generateWebhookSecret,
  generateInviteToken,
} from "@/lib/crypto";

describe("generateApiKey", () => {
  it("generates a key with the default 'ak' prefix", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^ak_[a-f0-9]{64}$/);
  });

  it("uses a custom prefix when provided", () => {
    const key = generateApiKey("test");
    expect(key.startsWith("test_")).toBe(true);
  });

  it("generates unique keys on each call", () => {
    const k1 = generateApiKey();
    const k2 = generateApiKey();
    expect(k1).not.toBe(k2);
  });
});

describe("hashApiKey", () => {
  it("returns a valid bcrypt hash string", () => {
    const hash = hashApiKey("ak_abc123");
    // BCrypt hashes start with $2a$, $2b$, or $2y$, followed by Cost, Salt, and Hash
    expect(hash).toMatch(/^\$2[aby]\$\d+\$[./A-Za-z0-9]{53}$/);
  });

  it("is non-deterministic — same input produces different salted hashes", () => {
    const input = "ak_someverylongapikey";
    const h1 = hashApiKey(input);
    const h2 = hashApiKey(input);
    expect(h1).not.toBe(h2);
  });

  it("produces verifiable hashes for the same inputs", () => {
    const input = "ak_someverylongapikey";
    const hash = hashApiKey(input);
    expect(verifyApiKey(input, hash)).toBe(true);
  });
});

describe("verifyApiKey", () => {
  it("returns true when the raw key matches its stored hash", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it("returns false when the raw key does not match", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey("ak_tampered_key", hash)).toBe(false);
  });

  it("returns false for invalid hash formats gracefully", () => {
    const key = generateApiKey();
    expect(verifyApiKey(key, "invalid_hash")).toBe(false);
  });
});

describe("generateWebhookSecret", () => {
  it("generates a secret with default 'whsec' prefix", () => {
    const secret = generateWebhookSecret();
    expect(secret.startsWith("whsec_")).toBe(true);
    expect(secret.length).toBe(6 + 48); // prefix + '_' + 48 character hex
  });

  it("uses a custom prefix if supplied", () => {
    const secret = generateWebhookSecret("stripe");
    expect(secret.startsWith("stripe_")).toBe(true);
  });
});

describe("generateInviteToken", () => {
  it("generates unique secure invite tokens", () => {
    const t1 = generateInviteToken();
    const t2 = generateInviteToken();
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[a-f0-9]{64}$/);
  });
});

