/**
 * Utility to validate if a Clerk publishable key is valid (i.e. not a dummy/placeholder key).
 * Dummy keys from .env.local like "pk_test_..." or "pk_test_1234567890abcdef" are treated as invalid
 * so that the app falls back to mock authentication mode automatically.
 */
export function isValidClerkKey(key: string | undefined): boolean {
  if (!key) return false;
  
  // Strip quotes if they were added via env parsing
  const cleanKey = key.replace(/['"]/g, "").trim();
  if (!cleanKey) return false;

  // Key must start with pk_test_ or pk_live_
  if (!cleanKey.startsWith("pk_test_") && !cleanKey.startsWith("pk_live_")) {
    return false;
  }

  // Must not be a known placeholder or contain ellipses
  if (cleanKey.includes("...") || cleanKey.includes("placeholder") || cleanKey.includes("1234567890")) {
    return false;
  }

  // Extract the base64 token
  const prefix = cleanKey.startsWith("pk_test_") ? "pk_test_" : "pk_live_";
  const base64Part = cleanKey.substring(prefix.length);

  try {
    // Decode the base64 token. atob is standard in modern environments (Node, Browser, Edge)
    const decoded = atob(base64Part);
    // A valid Clerk publishable key encodes a FAPI URL containing $
    return decoded.includes("$");
  } catch {
    return false;
  }
}
