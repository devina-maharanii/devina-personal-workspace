import { requireAuth, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import TeamViewClient from "@/components/team/TeamViewClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  // 1. Authenticate user
  const user = await requireAuth();

  // 2. Resolve active organization scope
  const org = await getActiveOrg(user.id);

  // 3. Resolve user role inside organization
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id,
      },
    },
  });

  const userRole = membership?.role || null;

  // 4. Retrieve list of active members
  const members = await db.membership.findMany({
    where: { organizationId: org.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  // 5. Retrieve list of pending active invitations
  const invitations = await db.invitation.findMany({
    where: {
      organizationId: org.id,
      acceptedAt: null,
      expiresAt: { gte: new Date() },
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <TeamViewClient
      currentUserId={user.id}
      userRole={userRole}
      activeOrg={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        maxMembers: org.maxMembers,
      }}
      members={members}
      invitations={invitations}
    />
  );
}
