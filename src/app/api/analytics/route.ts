import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cache, CACHE_KEYS } from "@/lib/redis";

import { subDays, parseISO, format, startOfDay, endOfDay, startOfMonth } from "date-fns";

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value == null) return 0;
  const n = Number(value as never);
  return Number.isFinite(n) ? n : 0;
};

const averageResponseTimeMs = (requests: number, promptTokens: number, completionTokens: number) => {
  if (requests <= 0) return 0;
  const avgPrompt = promptTokens / requests;
  const avgCompletion = completionTokens / requests;
  return Math.max(200, Math.round(800 + avgPrompt * 1.5 + avgCompletion * 3.5));
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId parameter" }, { status: 400 });
    }

    // 1. Verify membership
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized access to this organization" }, { status: 403 });
    }

    // 2. Fetch the Organization to determine the budget and details
    const org = await db.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // 3. Resolve Date Ranges
    const range = searchParams.get("range") || "30d";
    let startDate: Date;
    let endDate: Date;

    const today = new Date();

    if (range === "7d") {
      startDate = startOfDay(subDays(today, 6));
      endDate = endOfDay(today);
    } else if (range === "90d") {
      startDate = startOfDay(subDays(today, 89));
      endDate = endOfDay(today);
    } else if (range === "custom") {
      const fromParam = searchParams.get("from");
      const toParam = searchParams.get("to");
      if (fromParam && toParam) {
        startDate = startOfDay(parseISO(fromParam));
        endDate = endOfDay(parseISO(toParam));
      } else {
        startDate = startOfDay(subDays(today, 29));
        endDate = endOfDay(today);
      }
    } else {
      // Default to 30d
      startDate = startOfDay(subDays(today, 29));
      endDate = endOfDay(today);
    }

    const fromParam = searchParams.get("from") ?? undefined;
    const toParam = searchParams.get("to") ?? undefined;

    // Build cache key scoped to org + date range
    const cacheKey = CACHE_KEYS.analytics(orgId, range, fromParam, toParam);

    const responsePayload = await cache(
      cacheKey,
      async () => {
        // Calculate duration in ms
        const duration = endDate.getTime() - startDate.getTime();
        const previousPeriodStart = new Date(startDate.getTime() - duration);

        const [currentAgg] = await db.$queryRaw<Array<{
          requests: unknown;
          tokens: unknown;
          cost: unknown;
          prompt_tokens: unknown;
          completion_tokens: unknown;
        }>>`
          SELECT
            COUNT(*)::bigint as requests,
            COALESCE(SUM("totalTokens"), 0)::bigint as tokens,
            COALESCE(SUM("cost"), 0)::double precision as cost,
            COALESCE(SUM("promptTokens"), 0)::bigint as prompt_tokens,
            COALESCE(SUM("completionTokens"), 0)::bigint as completion_tokens
          FROM "AiUsageLog"
          WHERE "organizationId" = ${orgId}
            AND "createdAt" >= ${startDate}
            AND "createdAt" <= ${endDate}
        `;

        const [previousAgg] = await db.$queryRaw<Array<{
          requests: unknown;
          tokens: unknown;
          cost: unknown;
          prompt_tokens: unknown;
          completion_tokens: unknown;
        }>>`
          SELECT
            COUNT(*)::bigint as requests,
            COALESCE(SUM("totalTokens"), 0)::bigint as tokens,
            COALESCE(SUM("cost"), 0)::double precision as cost,
            COALESCE(SUM("promptTokens"), 0)::bigint as prompt_tokens,
            COALESCE(SUM("completionTokens"), 0)::bigint as completion_tokens
          FROM "AiUsageLog"
          WHERE "organizationId" = ${orgId}
            AND "createdAt" >= ${previousPeriodStart}
            AND "createdAt" < ${startDate}
        `;

        const currentRequests = toNumber(currentAgg?.requests);
        const previousRequests = toNumber(previousAgg?.requests);

        const currentTokens = toNumber(currentAgg?.tokens);
        const previousTokens = toNumber(previousAgg?.tokens);

        const currentCost = toNumber(currentAgg?.cost);
        const previousCost = toNumber(previousAgg?.cost);

        const currentPromptTokens = toNumber(currentAgg?.prompt_tokens);
        const currentCompletionTokens = toNumber(currentAgg?.completion_tokens);

        const previousPromptTokens = toNumber(previousAgg?.prompt_tokens);
        const previousCompletionTokens = toNumber(previousAgg?.completion_tokens);

        const currentAvgTime = averageResponseTimeMs(
          currentRequests,
          currentPromptTokens,
          currentCompletionTokens
        );
        const previousAvgTime = averageResponseTimeMs(
          previousRequests,
          previousPromptTokens,
          previousCompletionTokens
        );

        // Deltas calculation function (with safe division)
        const calculatePctChange = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        const metrics = {
          requests: {
            value: currentRequests,
            change: calculatePctChange(currentRequests, previousRequests),
          },
          tokens: {
            value: currentTokens,
            change: calculatePctChange(currentTokens, previousTokens),
          },
          cost: {
            value: currentCost,
            change: calculatePctChange(currentCost, previousCost),
          },
          responseTime: {
            value: currentAvgTime,
            change: calculatePctChange(currentAvgTime, previousAvgTime),
          },
        };

        // Daily usage (DB aggregation) + fill missing dates
        const dailyRows = await db.$queryRaw<Array<{
          date: string;
          requests: unknown;
          tokens: unknown;
          cost: unknown;
        }>>`
          SELECT
            to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
            COUNT(*)::bigint AS requests,
            COALESCE(SUM("totalTokens"), 0)::bigint AS tokens,
            COALESCE(SUM("cost"), 0)::double precision AS cost
          FROM "AiUsageLog"
          WHERE "organizationId" = ${orgId}
            AND "createdAt" >= ${startDate}
            AND "createdAt" <= ${endDate}
          GROUP BY 1
          ORDER BY 1 ASC
        `;

        const dailyMap: Record<string, { date: string; requests: number; tokens: number; cost: number }> = {};
        const iter = new Date(startDate);
        while (iter <= endDate) {
          const dateStr = format(iter, "yyyy-MM-dd");
          dailyMap[dateStr] = { date: dateStr, requests: 0, tokens: 0, cost: 0 };
          iter.setDate(iter.getDate() + 1);
        }

        for (const row of dailyRows) {
          if (!dailyMap[row.date]) continue;
          dailyMap[row.date].requests = toNumber(row.requests);
          dailyMap[row.date].tokens = toNumber(row.tokens);
          dailyMap[row.date].cost = toNumber(row.cost);
        }

        const dailyUsage = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

        const featureUsage = await db.$queryRaw<Array<{
          feature: string;
          requests: unknown;
          tokens: unknown;
          cost: unknown;
        }>>`
          SELECT
            INITCAP("feature") AS feature,
            COUNT(*)::bigint AS requests,
            COALESCE(SUM("totalTokens"), 0)::bigint AS tokens,
            COALESCE(SUM("cost"), 0)::double precision AS cost
          FROM "AiUsageLog"
          WHERE "organizationId" = ${orgId}
            AND "createdAt" >= ${startDate}
            AND "createdAt" <= ${endDate}
          GROUP BY 1
          ORDER BY requests DESC
        `;

        const normalizedFeatureUsage = featureUsage.map((row) => ({
          feature: row.feature,
          requests: toNumber(row.requests),
          tokens: toNumber(row.tokens),
          cost: toNumber(row.cost),
        }));

        const tokenBreakdown = {
          prompt: currentPromptTokens,
          completion: currentCompletionTokens,
          total: currentTokens,
        };

        const userUsage = await db.$queryRaw<Array<{
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
          requests: unknown;
          tokens: unknown;
          cost: unknown;
        }>>`
          SELECT
            u."id" AS id,
            COALESCE(u."name", split_part(u."email", '@', 1)) AS name,
            u."email" AS email,
            u."avatarUrl" AS "avatarUrl",
            COUNT(*)::bigint AS requests,
            COALESCE(SUM(l."totalTokens"), 0)::bigint AS tokens,
            COALESCE(SUM(l."cost"), 0)::double precision AS cost
          FROM "AiUsageLog" l
          JOIN "User" u ON u."id" = l."userId"
          WHERE l."organizationId" = ${orgId}
            AND l."createdAt" >= ${startDate}
            AND l."createdAt" <= ${endDate}
          GROUP BY u."id", u."name", u."email", u."avatarUrl"
          ORDER BY requests DESC
        `;

        const normalizedUserUsage = userUsage.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          avatarUrl: row.avatarUrl,
          requests: toNumber(row.requests),
          tokens: toNumber(row.tokens),
          cost: toNumber(row.cost),
        }));

        // Month-to-Date (MTD) Spend & Projection calculations
        const mtdStart = startOfMonth(today);
        const [mtdRow] = await db.$queryRaw<Array<{ mtd_spend: unknown }>>`
          SELECT COALESCE(SUM("cost"), 0)::double precision AS mtd_spend
          FROM "AiUsageLog"
          WHERE "organizationId" = ${orgId}
            AND "createdAt" >= ${mtdStart}
            AND "createdAt" <= ${today}
        `;

        const mtdSpend = toNumber(mtdRow?.mtd_spend);

        const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDayInMonth = today.getDate() + today.getHours() / 24 + today.getMinutes() / 1440;
        const projectedSpend = currentDayInMonth > 0 ? (mtdSpend / currentDayInMonth) * totalDaysInMonth : 0;

        const plan = (org.plan || "FREE").toUpperCase();
        const budget = plan === "ENTERPRISE" ? 1000.0 : 100.0;

        const costProjection = {
          mtdSpend,
          projectedSpend,
          budget,
          plan,
        };

        return {
          metrics,
          dailyUsage,
          featureUsage: normalizedFeatureUsage,
          tokenBreakdown,
          userUsage: normalizedUserUsage,
          costProjection,
        };
      },
      300,
    );

    const response = NextResponse.json(responsePayload);
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("Error in /api/analytics route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
