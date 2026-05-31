import { requireAuth, getActiveOrg } from "@/lib/auth";
import FilesPageClient from "@/components/files/FilesPageClient";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  // 1. Authenticate user session securely
  const user = await requireAuth();

  // 2. Fetch the active organization context
  const org = await getActiveOrg(user.id);

  return <FilesPageClient orgId={org.id} plan={org.plan} />;
}
