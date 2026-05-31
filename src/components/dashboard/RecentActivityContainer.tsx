import { db } from "@/lib/db";
import RecentActivity, { ActivityItem } from "./RecentActivity";

interface RecentActivityContainerProps {
  organizationId: string;
}

export default async function RecentActivityContainer({ organizationId }: RecentActivityContainerProps) {
  // 1. Resolve all member IDs in the active organization to scope audit logs
  const memberships = await db.membership.findMany({
    where: { organizationId },
    select: { userId: true },
  });

  const memberUserIds = memberships.map((m) => m.userId);

  // 2. Fetch the latest 8 logs representing actions performed by members
  const logs = await db.auditLog.findMany({
    where: {
      userId: { in: memberUserIds },
    },
    take: 8,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  const activities: ActivityItem[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt,
    user: log.user
      ? {
          name: log.user.name,
          email: log.user.email,
          avatarUrl: log.user.avatarUrl,
        }
      : null,
  }));

  return <RecentActivity activities={activities} />;
}
