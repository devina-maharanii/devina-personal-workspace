import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FeaturesPageClient } from "@/components/admin/FeaturesPageClient";
import type { OrgFeatureItem } from "@/components/admin/FeaturesPageClient";

export const dynamic = "force-dynamic";

/**
 * Server page component that resolves active organizations configurations and overrides.
 */
export default async function AdminFeaturesPage() {
  // Enforce administrative authentication
  await requireAdmin();

  // Query organizations and their respective settings for feature flag states
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      settings: true,
    },
  });

  const normalizeFeatures = (value: unknown): Record<string, boolean> | string | null => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, boolean>;
    }
    return null;
  };

  const initialOrgs: OrgFeatureItem[] = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    plan: org.plan,
    settings: org.settings
      ? { features: normalizeFeatures(org.settings.features) }
      : null,
  }));

  return <FeaturesPageClient initialOrgs={initialOrgs} />;
}
