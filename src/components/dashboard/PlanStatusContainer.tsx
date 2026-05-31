import { db } from "@/lib/db";
import PlanStatus, { QuotaUsage } from "./PlanStatus";

interface PlanStatusContainerProps {
  userId: string;
  organizationId: string;
  plan: string;
  maxMembers: number;
  maxAiCredits: number;
  usedAiCredits: number;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
}

export default async function PlanStatusContainer({
  userId,
  organizationId,
  plan,
  maxMembers,
  maxAiCredits,
  usedAiCredits,
  subscriptionStatus,
  currentPeriodEnd,
}: PlanStatusContainerProps) {
  void userId;
  // 1. Fetch team members count
  const memberCount = await db.membership.count({
    where: { organizationId },
  });

  // 2. Fetch storage size summation (File table)
  const storageAggregate = await db.file.aggregate({
    where: { organizationId },
    _sum: {
      size: true,
    },
  });

  const totalBytes = storageAggregate._sum.size || 0;
  const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(1));

  // Determine limits based on plan
  let storageLimitGB = 1; // FREE
  if (plan === "PRO") storageLimitGB = 10;
  if (plan === "ENTERPRISE") storageLimitGB = 100;

  const usages: QuotaUsage[] = [
    {
      label: "AI Credits Usage",
      used: usedAiCredits,
      limit: maxAiCredits,
    },
    {
      label: "Team Members",
      used: memberCount,
      limit: maxMembers,
    },
    {
      label: "Storage Space",
      used: totalMB,
      limit: storageLimitGB * 1024,
      unit: " MB",
    },
  ];

  const isFreePlan = plan === "FREE" || subscriptionStatus === "FREE";

  return (
    <PlanStatus
      planName={plan}
      renewalDate={currentPeriodEnd}
      usages={usages}
      isFreePlan={isFreePlan}
    />
  );
}
