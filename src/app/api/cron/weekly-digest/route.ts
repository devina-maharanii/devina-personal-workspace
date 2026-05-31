import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/resend";
import { WeeklyDigestEmail } from "@/emails/WeeklyDigestEmail";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize CRON request (using case-insensitive authorization check)
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch all active users with weekly digest enabled
    const users = await db.user.findMany({
      where: {
        deletedAt: null,
        notificationDigestFreq: "weekly",
      },
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let emailsDispatched = 0;

    const orgIds = Array.from(
      new Set(
        users.flatMap((user) =>
          user.memberships.map((membership) => membership.organizationId)
        )
      )
    );

    const [usageAgg, fileAgg, memberAgg] = orgIds.length
      ? await Promise.all([
          db.aiUsageLog.groupBy({
            by: ["organizationId"],
            where: {
              organizationId: { in: orgIds },
              createdAt: { gte: sevenDaysAgo },
            },
            _count: { _all: true },
            _sum: { totalTokens: true },
          }),
          db.file.groupBy({
            by: ["organizationId"],
            where: { organizationId: { in: orgIds } },
            _count: { _all: true },
          }),
          db.membership.groupBy({
            by: ["organizationId"],
            where: { organizationId: { in: orgIds } },
            _count: { _all: true },
          }),
        ])
      : [[], [], []];

    const usageMap = new Map(usageAgg.map((row) => [row.organizationId, row]));
    const fileMap = new Map(fileAgg.map((row) => [row.organizationId, row]));
    const memberMap = new Map(memberAgg.map((row) => [row.organizationId, row]));

    // 3. Aggregate metrics for each user's organization and send the weekly digest email
    for (const user of users) {
      if (!user.email) continue;

      const firstMembership = user.memberships[0];
      const org = firstMembership?.organization;
      const orgName = org?.name || "Your Workspace";
      const orgId = org?.id;

      let totalRequests = 0;
      let totalTokens = 0;
      let activeMembersCount = 1;
      let storageUsedString = "0 MB";

      if (orgId && org) {
        const usage = usageMap.get(orgId);
        totalRequests = usage?._count._all ?? 0;
        totalTokens = usage?._sum.totalTokens ?? 0;
        activeMembersCount = memberMap.get(orgId)?._count._all ?? 1;

        const storageCount = fileMap.get(orgId)?._count._all ?? 0;
        storageUsedString = storageCount > 0 ? `${(storageCount * 2.4).toFixed(1)} MB` : "0 MB";
      }

      const formattedTokens = totalTokens.toLocaleString();

      // Dispatch the WeeklyDigestEmail
      await sendTransactionalEmail(
        user.email,
        `Your Weekly Workspace Summary: ${orgName}`,
        WeeklyDigestEmail,
        {
          name: user.name || "there",
          orgName,
          aiRequestsCount: totalRequests,
          tokensUsed: formattedTokens,
          storageUsed: storageUsedString,
          activeMembersCount: activeMembersCount,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
        }
      ).catch((emailErr) => {
        console.error(`Failed to send weekly digest email to user ${user.email}:`, emailErr);
      });

      emailsDispatched++;
    }

    return NextResponse.json({
      success: true,
      processedUsers: users.length,
      emailsDispatched,
    });
   
  } catch (error: unknown) {
    console.error("Error executing weekly digest cron:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
