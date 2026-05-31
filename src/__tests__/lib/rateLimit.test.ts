import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/redis", () => ({
  redis: {},
}));

vi.mock("@upstash/ratelimit", () => {
  const mockLimit = vi.fn();
  function Ratelimit() {
    return { limit: mockLimit };
  }
  Ratelimit.slidingWindow = vi.fn().mockReturnValue("sliding-window-config");
  Ratelimit.__mockLimit = mockLimit;
  return { Ratelimit };
});

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === "x-forwarded-for") return "203.0.113.42";
      return null;
    }),
  }),
}));

import { getClientIp, checkRateLimit, withRateLimit, aiLimiter } from "@/lib/rateLimit";
import { Ratelimit } from "@upstash/ratelimit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockLimit = (Ratelimit as any).__mockLimit as ReturnType<typeof vi.fn>;

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", async () => {
    const ip = await getClientIp();
    expect(ip).toBe("203.0.113.42");
  });

  it("returns 127.0.0.1 as fallback when headers() throws", async () => {
    const { headers } = await import("next/headers");
    (headers as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("no headers"));
    const ip = await getClientIp();
    expect(ip).toBe("127.0.0.1");
  });

  it("uses x-real-ip when x-forwarded-for is absent", async () => {
    const { headers } = await import("next/headers");
    (headers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: (key: string) => (key === "x-real-ip" ? "10.0.0.1" : null),
    });
    const ip = await getClientIp();
    expect(ip).toBe("10.0.0.1");
  });

  it("takes only the first IP from a comma-separated x-forwarded-for list", async () => {
    const { headers } = await import("next/headers");
    (headers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: (key: string) =>
        key === "x-forwarded-for" ? "1.2.3.4, 5.6.7.8, 9.10.11.12" : null,
    });
    const ip = await getClientIp();
    expect(ip).toBe("1.2.3.4");
  });
});

// ─── checkRateLimit ───────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success:true when under the limit", async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 });

    const result = await checkRateLimit({ identifier: "user_1", limiter: aiLimiter });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("returns success:false when over the limit", async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 60000 });

    const result = await checkRateLimit({ identifier: "user_1", limiter: aiLimiter });

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("fails open (success:true) when Redis throws", async () => {
    mockLimit.mockRejectedValue(new Error("Redis unavailable"));

    const result = await checkRateLimit({ identifier: "user_1", limiter: aiLimiter });

    expect(result.success).toBe(true);
  });

  it("fails closed (success:false) in production when Redis throws", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    try {
      mockLimit.mockRejectedValue(new Error("Redis unavailable"));
      const result = await checkRateLimit({ identifier: "user_1", limiter: aiLimiter });
      expect(result.success).toBe(false);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prev;
    }
  });
});

// ─── withRateLimit ────────────────────────────────────────────────────────────

describe("withRateLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  const makeRequest = () => new Request("https://example.com/api/test");

  it("calls the handler when under the limit", async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 });

    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(aiLimiter, () => "user_1", handler);

    const res = await wrapped(makeRequest());
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("returns 429 when over the limit", async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 5000 });

    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(aiLimiter, () => "user_1", handler);

    const res = await wrapped(makeRequest());
    expect(res.status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
  });

  it("includes rate limit headers in the 429 response", async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 5000 });

    const wrapped = withRateLimit(aiLimiter, () => "user_1", vi.fn());
    const res = await wrapped(makeRequest());

    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("fails open and calls handler when Redis throws", async () => {
    mockLimit.mockRejectedValue(new Error("Redis down"));

    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(aiLimiter, () => "user_1", handler);

    const res = await wrapped(makeRequest());
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("fails closed in production when Redis throws", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    try {
      mockLimit.mockRejectedValue(new Error("Redis down"));

      const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
      const wrapped = withRateLimit(aiLimiter, () => "user_1", handler);

      const res = await wrapped(makeRequest());
      expect(res.status).toBe(503);
      expect(handler).not.toHaveBeenCalled();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prev;
    }
  });
});
