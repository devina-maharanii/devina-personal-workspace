import { getAllOrganizations } from "@/lib/actions/admin";
import { OrgsPageClient } from "@/components/admin/OrgsPageClient";

export const dynamic = "force-dynamic";

/**
 * Server page resolver for the administrator organization list.
 */
export default async function AdminOrganizationsPage() {
  const result = await getAllOrganizations({
    page: 1,
    limit: 10,
    search: "",
    plan: "ALL",
  });

  return (
    <OrgsPageClient 
      initialOrgs={result.organizations} 
      initialPagination={result.pagination} 
    />
  );
}
