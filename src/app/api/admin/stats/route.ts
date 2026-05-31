import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlanByPriceId } from "@/lib/stripe";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET secure super-admin analytics aggregations including subscription status breakdowns and MRR.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, totalOrgs, payingUsersRaw] = await Promise.all([
      db.user.count(),
      db.organization.count(),
      db.user.findMany({
        where: {
          stripePriceId: { not: null },
          deletedAt: null,
        },
        select: {
          stripePriceId: true,
          createdAt: true,
        },
      }),
    ]);

    let mrr = 0;
    let proCount = 0;
    let enterpriseCount = 0;

    payingUsersRaw.forEach((user) => {
      const plan = getPlanByPriceId(user.stripePriceId || "");
      mrr += plan.price;
      if (plan.id === "pro") {
        proCount++;
      } else if (plan.id === "enterprise") {
        enterpriseCount++;
      }
    });

    const activeSubscriptionsCount = payingUsersRaw.length;

    // Subscription status breakdown
    const subscriptionStatusCounts = await db.user.groupBy({
      by: ["subscriptionStatus"],
      where: {
        stripeSubscriptionId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const statusBreakdown = subscriptionStatusCounts.reduce((acc, current) => {
      acc[current.subscriptionStatus] = current._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalOrganizations: totalOrgs,
        totalSubscriptions: activeSubscriptionsCount,
        mrr,
        breakdown: {
          pro: proCount,
          enterprise: enterpriseCount,
          free: Math.max(0, totalUsers - activeSubscriptionsCount),
        },
        statusBreakdown,
      },
    });
   
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Failed to fetch admin stats API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
