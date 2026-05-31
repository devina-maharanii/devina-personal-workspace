import { requireAuth, getActiveOrg } from "@/lib/auth";
import AnalyticsPageClient from "@/components/analytics/AnalyticsPageClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // 1. Authenticate user session
  const user = await requireAuth();

  // 2. Fetch active organization scope
  const org = await getActiveOrg(user.id);

  return <AnalyticsPageClient orgId={org.id} orgName={org.name} />;
}
