import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Resolves the client IP address from HTTP headers for rate limiting keys.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const xForwardedFor = headersList.get("x-forwarded-for");
    const xRealIp = headersList.get("x-real-ip");

    if (xForwardedFor) {
      return xForwardedFor.split(",")[0].trim();
    }
    if (xRealIp) {
      return xRealIp.trim();
    }
   
  } catch (_error) {
    // Non-HTTP environments or seed context
  }
  return "127.0.0.1";
}

// 1. aiLimiter: 10 requests per 60 seconds per userId (sliding window)
export const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ai-limiter",
});

// 2. authLimiter: 5 requests per 60 seconds per IP (sliding window)
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "auth-limiter",
});

// 3. stripeLimiter: 20 requests per 60 seconds per userId (sliding window)
export const stripeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "stripe-limiter",
});

// 4. apiLimiter: 100 requests per 60 seconds per IP (sliding window)
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "api-limiter",
});

/**
 * Standard interface for rate limit check results
 */
interface RateLimitConfig {
  identifier: string;
  limiter?: Ratelimit;
}

function shouldFailClosed(limiter: Ratelimit): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  return limiter === authLimiter || limiter === aiLimiter;
}

/**
 * Direct check utility for inline rate-limiting checks (such as inside actions).
 */
export async function checkRateLimit({
  identifier,
  limiter = apiLimiter,
}: RateLimitConfig) {
  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);
    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);

    // In production, fail-closed for the most abuse-prone paths.
    if (shouldFailClosed(limiter)) {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: 0,
      };
    }

    // Else fail-open to avoid locking out legitimate users if Redis is down.
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

/**
 * Higher-order Route Handler wrapper that handles rate limiting dynamically,
 * appending rate-limit headers to client responses, and returning 429 when throttled.
 */
export function withRateLimit<T extends Request>(
  limiter: Ratelimit,
  getIdentifier: (req: T) => Promise<string> | string,
  handler: (req: T, context?: unknown) => Promise<Response> | Response
) {
  return async (req: T, context?: unknown) => {
    try {
      const identifier = await getIdentifier(req);
      const { success, limit, remaining, reset } = await limiter.limit(identifier);

      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      const rateLimitHeaders = {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      };

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down and try again later." },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders,
              "Retry-After": Math.max(1, retryAfter).toString(),
            },
          }
        );
      }

      const response = await handler(req, context);
      
      // Inject rate limit headers if possible (Response or NextResponse context)
      if (response && response.headers) {
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          try {
            response.headers.set(key, value);
           
          } catch (_headerSetError) {
            // Read-only headers in standard Response sometimes throw in certain versions
          }
        }
      }

      return response;
    } catch (error) {
      console.error("Rate limit wrapper error:", error);

      if (shouldFailClosed(limiter)) {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please retry." },
          { status: 503, headers: { "Retry-After": "1" } }
        );
      }

      // Fail-open strategy
      return handler(req, context);
    }
  };
}
