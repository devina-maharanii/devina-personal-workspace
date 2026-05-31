import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { redis, CACHE_KEYS } from "@/lib/redis";

interface OrgDomainData {
  orgId?: string;
  brandColor?: string | null;
  logo?: string | null;
  customFooterText?: string | null;
  name?: string | null;
  slug?: string | null;
  error?: boolean;
}

const getString = (value: unknown) => (typeof value === "string" ? value : "");

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/ai(.*)",
  "/billing(.*)",
  "/team(.*)",
  "/settings(.*)",
  "/notifications(.*)",
  "/onboarding(.*)",
  "/analytics(.*)",
  "/api/protected(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/ai(.*)",
  "/api/stripe(.*)",
  "/api/notifications(.*)",
  "/api/user(.*)",
  "/api/search(.*)",
  "/api/sse(.*)",
]);

function e2eMiddleware(req: NextRequest): NextResponse {
  const hasMockSession = req.cookies.get("mock_session")?.value === "true";

  if (!hasMockSession) {
    if (isProtectedApiRoute(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isProtectedRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
}

async function handleCustomDomain(req: NextRequest): Promise<NextResponse | undefined> {
  const url = new URL(req.url);
  const hostname = req.headers.get("host") || "";

  const mainDomains = [
    "localhost:3000",
    "ai-saas-boilerplate-pro.com",
    "www.ai-saas-boilerplate-pro.com",
  ];

  const cleanDomain = hostname.toLowerCase().trim().replace(/^www\./, "");
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d+)?$/;
  if (!domainRegex.test(cleanDomain)) return undefined;
  if (!cleanDomain || mainDomains.includes(cleanDomain)) return undefined;

  const cacheKey = CACHE_KEYS.domainOrg(cleanDomain);
  let orgData: OrgDomainData | null = null;

  try {
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "object") orgData = cached as OrgDomainData;
    else if (cached && typeof cached === "string") orgData = JSON.parse(cached);
  } catch {
    // Redis unavailable — fall through.
  }

  if (!orgData) {
    try {
      const res = await fetch(new URL(`/api/resolve-domain?domain=${cleanDomain}`, req.url));
      if (res.ok) {
        const data = await res.json();
        orgData = {
          orgId: data.orgId,
          brandColor: data.brandColor,
          logo: data.logo,
          customFooterText: data.customFooterText,
          name: data.name,
          slug: data.slug,
        };
        await redis.set(cacheKey, JSON.stringify(orgData), { ex: 3600 }).catch(() => {});
      } else if (res.status === 404) {
        orgData = { error: true };
        await redis.set(cacheKey, JSON.stringify(orgData), { ex: 300 }).catch(() => {});
      }
    } catch {
      // Domain resolution failed.
    }
  }

  if (orgData && !orgData.error && orgData.orgId) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-org-id", getString(orgData.orgId));
    requestHeaders.set("x-org-brand-color", getString(orgData.brandColor) || "#6366f1");
    requestHeaders.set("x-org-logo", getString(orgData.logo));
    requestHeaders.set("x-org-footer-text", getString(orgData.customFooterText));
    requestHeaders.set("x-org-name", getString(orgData.name));
    requestHeaders.set("x-org-slug", getString(orgData.slug));
    return NextResponse.rewrite(new URL(`/${cleanDomain}${url.pathname}`, req.url), {
      request: { headers: requestHeaders },
    });
  }

  return undefined;
}

const isMockAuthEnabled =
  process.env.NODE_ENV !== "production" &&
  (process.env.FORCE_MOCK_AUTH === "true" || process.env.E2E_TEST_MODE === "true");

export default isMockAuthEnabled
  ? e2eMiddleware
  : clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();

  if (isAdminRoute(req)) {
    const session = await auth();
    if (session.sessionClaims?.metadata?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

    const domainRewrite = await handleCustomDomain(req);
    if (domainRewrite) return domainRewrite;
  });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
