import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generates a cryptographically secure random API key with a prefix.
 */
export function generateApiKey(prefix = "ak"): string {
  const secretBytes = crypto.randomBytes(32).toString("hex");
  return `${prefix}_${secretBytes}`;
}

/**
 * Hashes an API key using bcryptjs for secure, non-deterministic, salted storage.
 */
export function hashApiKey(apiKey: string): string {
  return bcrypt.hashSync(apiKey, 10);
}

/**
 * Edge-compatible, timing-safe verification comparing a raw API key with a bcrypt hash.
 */
export function verifyApiKey(apiKey: string, hashedApiKey: string): boolean {
  try {
    return bcrypt.compareSync(apiKey, hashedApiKey);
   
  } catch (_error) {
    return false;
  }
}

/**
 * Generates a cryptographically secure random webhook secret.
 */
export function generateWebhookSecret(prefix = "whsec"): string {
  const secretBytes = crypto.randomBytes(24).toString("hex");
  return `${prefix}_${secretBytes}`;
}

/**
 * Generates a cryptographically secure random invite token.
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

