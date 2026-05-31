import { db } from "@/lib/db";
import { subDays, differenceInDays } from "date-fns";
import StatsGrid, { MetricCard } from "./StatsGrid";

interface StatsGridContainerProps {
  userId: string;
  organizationId: string;
  plan: string;
  maxMembers: number;
  maxAiCredits: number;
  usedAiCredits: number;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
}

export default async function StatsGridContainer({
  userId,
  organizationId,
  plan,
  maxMembers,
  maxAiCredits,
  usedAiCredits,
  subscriptionStatus,
  currentPeriodEnd,
}: StatsGridContainerProps) {
  void userId;
  // 1. Fetch AI logs count to compute trend (last 30d vs prior 30d)
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  const [thisMonthLogs, lastMonthLogs] = await Promise.all([
    db.aiUsageLog.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    db.aiUsageLog.count({
      where: {
        organizationId,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
  ]);

  let creditsTrendValue = 0;
  if (lastMonthLogs > 0) {
    creditsTrendValue = Math.round(((thisMonthLogs - lastMonthLogs) / lastMonthLogs) * 100);
  } else if (thisMonthLogs > 0) {
    creditsTrendValue = 100;
  }

  // 2. Fetch team members count
  const teamCount = await db.membership.count({
    where: { organizationId },
  });

  // 3. Fetch storage size summation (File table)
  const storageAggregate = await db.file.aggregate({
    where: { organizationId },
    _sum: {
      size: true,
    },
  });

  const totalBytes = storageAggregate._sum.size || 0;
  const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(1));
  const totalGB = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));

  // Determine limits based on plan
  let storageLimitGB = 1; // FREE
  if (plan === "PRO") storageLimitGB = 10;
  if (plan === "ENTERPRISE") storageLimitGB = 100;

  // 4. Calculate subscription days remaining
  let daysRemainingSubtext = "Unlimited lifetime access";
  let daysRemainingValue = 0;
  if (currentPeriodEnd) {
    const days = differenceInDays(new Date(currentPeriodEnd), now);
    daysRemainingValue = Math.max(0, days);
    daysRemainingSubtext = daysRemainingValue > 0 
      ? `${daysRemainingValue} days remaining`
      : "Renews today";
  } else if (subscriptionStatus === "FREE") {
    daysRemainingSubtext = "Free tier access";
  }

  const metrics: MetricCard[] = [
    {
      label: "AI Credits Used",
      value: usedAiCredits,
      limit: maxAiCredits,
      subtext: `${maxAiCredits - usedAiCredits} credits left`,
      trend: {
        value: Math.abs(creditsTrendValue),
        isPositive: creditsTrendValue >= 0,
      },
      type: "credits",
    },
    {
      label: "Team Members",
      value: teamCount,
      limit: maxMembers,
      subtext: `${maxMembers - teamCount} seats vacant`,
      type: "members",
    },
    {
      label: "Storage Used",
      value: totalMB,
      limit: storageLimitGB * 1024, // Keep unit in MB for progress calculation
      formattedValue: `${totalGB} GB`,
      subtext: `Limit: ${storageLimitGB} GB`,
      type: "storage",
    },
    {
      label: "Active Plan",
      value: daysRemainingValue,
      formattedValue: plan,
      subtext: daysRemainingSubtext,
      type: "subscription",
    },
  ];

  return <StatsGrid metrics={metrics} />;
}
