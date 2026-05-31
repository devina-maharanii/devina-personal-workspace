import { requireAuth, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import DomainSettingsClient from "@/components/team/DomainSettingsClient";
import { redirect } from "next/navigation";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = constructMetadata({
  title: "Domain & Branding Settings | Dashboard",
  noIndex: true,
});

export default async function DomainSettingsPage() {
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

  // 4. Load initial organization settings
  const settings = await db.organizationSettings.findUnique({
    where: { organizationId: org.id },
  });

  return (
    <DomainSettingsClient
      userRole={userRole}
      activeOrg={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
      }}
      initialSettings={
        settings
          ? {
              customDomain: settings.customDomain,
              domainVerificationToken: settings.domainVerificationToken,
              domainStatus: settings.domainStatus,
              brandColor: settings.brandColor,
              customFooterText: settings.customFooterText,
              domainVerifiedAt: settings.domainVerifiedAt,
            }
          : null
      }
    />
  );
}
