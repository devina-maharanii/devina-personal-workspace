import { Redis } from '@upstash/redis';
import { env } from './env';

// Check if Upstash Redis is configured with placeholder values
export const isPlaceholder = !env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_URL.includes("placeholder");

// Timing-safe fail-fast mock for Redis in development/preview environments
const mockRedisHandler: ProxyHandler<Record<string, unknown>> = {
  get(_target, prop) {
    if (prop === "then") return undefined;
    return async (...args: unknown[]) => {
      if (prop === "get") {
        return null;
      }
      if (prop === "set") {
        return "OK";
      }
      if (prop === "del") {
        return args.length;
      }
      // For Lua scripts used by @upstash/ratelimit, return values that prevent crashes
      if (prop === "eval" || prop === "evalsha") {
        // Return success=1 (allowed), limit=100, remaining=99, reset=tomorrow
        return [1, 100, 99, Date.now() + 86400000];
      }
      return null;
    };
  }
};

// ---------------------------------------------------------------------------
// General-purpose Redis client
// ---------------------------------------------------------------------------
export const redis = isPlaceholder 
  ? new Proxy({}, mockRedisHandler) as unknown as Redis 
  : new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

// For Upstash Redis REST, pub/sub operates on the same client footprint,
// but exporting specific aliases helps with architectural semantic clarity.
export const redisPub = redis;
export const redisSub = isPlaceholder 
  ? new Proxy({}, mockRedisHandler) as unknown as Redis
  : new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

// ---------------------------------------------------------------------------
// Cache key namespace constants — keeps keys collision-safe across the app.
// ---------------------------------------------------------------------------
export const CACHE_KEYS = {
  /** 60 s — user profile from DB (clerkId scoped) */
  userProfile: (clerkId: string) => `user:profile:${clerkId}`,
  /** 60 s — active org resolved from cookie + first membership */
  activeOrg: (userId: string, orgId: string) => `user:active-org:${userId}:${orgId}`,
  /** 60 s — list of orgs the user belongs to (sidebar nav) */
  userMemberships: (userId: string) => `user:memberships:${userId}`,
  /** 60 s — active system-wide announcement */
  activeAnnouncement: () => `announcements:active`,
  /** 300 s — heavy analytics aggregates per org + range */
  analytics: (orgId: string, range: string, from?: string, to?: string) =>
    `analytics:${orgId}:${range}:${from ?? ''}:${to ?? ''}`,
  /** 30 s — global search results per org + query string */
  search: (orgId: string, query: string) => `search:${orgId}:${query}`,
  /** 3600 s — custom domain → org mapping (also set by middleware) */
  domainOrg: (hostname: string) => `domain:org:${hostname}`,
} as const;

// ---------------------------------------------------------------------------
// cache<T>
//
// Generic read-through cache helper.
//   1. Attempts a Redis GET for `key`.
//   2. On HIT — returns the parsed value immediately.
//   3. On MISS — calls `fetcher()`, stores the result with `ttlSeconds`,
//      then returns the freshly-fetched value.
//
// TTL defaults to 60 seconds. Pass 0 to disable caching (useful in tests).
// ---------------------------------------------------------------------------
export async function cache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 60,
): Promise<T> {
  // Skip Redis on TTL = 0 or when using placeholder (escape hatch for tests / force-dynamic pages)
  if (ttlSeconds === 0 || isPlaceholder) return fetcher();

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (err) {
    // Redis unavailable — fall through to the database
    console.warn('[cache] Redis GET failed, falling through to fetcher:', err);
  }

  const fresh = await fetcher();

  try {
    // Store as JSON string with an absolute expiry
    await redis.set(key, fresh, { ex: ttlSeconds });
  } catch (err) {
    console.warn('[cache] Redis SET failed — data served fresh but not cached:', err);
  }

  return fresh;
}

// ---------------------------------------------------------------------------
// invalidateCache
//
// Deletes one or more Redis keys atomically (pipeline for multiple keys).
// Safe to call after any mutation (Server Actions, API routes, webhooks).
// ---------------------------------------------------------------------------
export async function invalidateCache(keys: string | string[]): Promise<void> {
  const keyList = Array.isArray(keys) ? keys : [keys];
  if (keyList.length === 0) return;

  try {
    if (keyList.length === 1) {
      await redis.del(keyList[0]);
    } else {
      // Upstash supports variadic DEL
      await redis.del(...keyList);
    }
  } catch (err) {
    console.warn('[invalidateCache] Failed to delete keys:', keyList, err);
  }
}
