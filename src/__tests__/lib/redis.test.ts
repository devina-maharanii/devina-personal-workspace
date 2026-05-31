import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@upstash/redis", () => {
  function Redis() {
    return {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      publish: vi.fn(),
    };
  }
  return { Redis };
});

vi.mock("@/lib/env", () => ({
  env: {
    UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "test_token",
  },
}));

import { redis, cache, invalidateCache, CACHE_KEYS } from "@/lib/redis";

// ─── CACHE_KEYS ───────────────────────────────────────────────────────────────

describe("CACHE_KEYS", () => {
  it("userProfile key is scoped to clerkId", () => {
    expect(CACHE_KEYS.userProfile("clerk_abc")).toBe("user:profile:clerk_abc");
  });

  it("activeOrg key is scoped to userId and orgId", () => {
    expect(CACHE_KEYS.activeOrg("u1", "o1")).toBe("user:active-org:u1:o1");
  });

  it("userMemberships key is scoped to userId", () => {
    expect(CACHE_KEYS.userMemberships("u1")).toBe("user:memberships:u1");
  });

  it("activeAnnouncement key is a fixed string", () => {
    expect(CACHE_KEYS.activeAnnouncement()).toBe("announcements:active");
  });

  it("analytics key includes orgId and range", () => {
    const key = CACHE_KEYS.analytics("org1", "7d");
    expect(key).toContain("org1");
    expect(key).toContain("7d");
  });

  it("search key includes orgId and query", () => {
    expect(CACHE_KEYS.search("org1", "hello")).toBe("search:org1:hello");
  });

  it("domainOrg key includes hostname", () => {
    expect(CACHE_KEYS.domainOrg("acme.com")).toBe("domain:org:acme.com");
  });
});

// ─── cache() ─────────────────────────────────────────────────────────────────

describe("cache()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns cached value on HIT without calling fetcher", async () => {
    vi.mocked(redis.get).mockResolvedValue({ id: "cached" });
    const fetcher = vi.fn();

    const result = await cache("test-key", fetcher, 60);

    expect(result).toEqual({ id: "cached" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("calls fetcher and stores result on MISS", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.set).mockResolvedValue("OK");
    const fetcher = vi.fn().mockResolvedValue({ id: "fresh" });

    const result = await cache("test-key", fetcher, 60);

    expect(result).toEqual({ id: "fresh" });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(redis.set).toHaveBeenCalledWith("test-key", { id: "fresh" }, { ex: 60 });
  });

  it("bypasses Redis entirely when ttlSeconds is 0", async () => {
    const fetcher = vi.fn().mockResolvedValue("direct");

    const result = await cache("test-key", fetcher, 0);

    expect(result).toBe("direct");
    expect(redis.get).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("falls through to fetcher when Redis GET throws", async () => {
    vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));
    vi.mocked(redis.set).mockResolvedValue("OK");
    const fetcher = vi.fn().mockResolvedValue("fallback");

    const result = await cache("test-key", fetcher, 60);

    expect(result).toBe("fallback");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("still returns fresh data when Redis SET throws after a MISS", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.set).mockRejectedValue(new Error("Redis write failed"));
    const fetcher = vi.fn().mockResolvedValue("fresh-uncached");

    const result = await cache("test-key", fetcher, 60);

    expect(result).toBe("fresh-uncached");
  });
});

// ─── invalidateCache() ────────────────────────────────────────────────────────

describe("invalidateCache()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a single key", async () => {
    vi.mocked(redis.del).mockResolvedValue(1);

    await invalidateCache("user:profile:clerk_1");

    expect(redis.del).toHaveBeenCalledWith("user:profile:clerk_1");
  });

  it("deletes multiple keys in one call", async () => {
    vi.mocked(redis.del).mockResolvedValue(2);

    await invalidateCache(["key:1", "key:2"]);

    expect(redis.del).toHaveBeenCalledWith("key:1", "key:2");
  });

  it("does nothing for an empty array", async () => {
    await invalidateCache([]);
    expect(redis.del).not.toHaveBeenCalled();
  });

  it("does not throw when Redis DEL fails", async () => {
    vi.mocked(redis.del).mockRejectedValue(new Error("Redis unavailable"));

    await expect(invalidateCache("some-key")).resolves.toBeUndefined();
  });
});
