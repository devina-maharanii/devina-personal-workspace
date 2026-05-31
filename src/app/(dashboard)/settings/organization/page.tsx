import { requireAuth, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import OrgSettingsClient from "@/components/team/OrgSettingsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrgSettingsPage() {
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

  // Protect settings access: Only OWNER and ADMIN can update settings
  if (userRole !== "OWNER" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <OrgSettingsClient
      userRole={userRole}
      activeOrg={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
      }}
    />
  );
}
