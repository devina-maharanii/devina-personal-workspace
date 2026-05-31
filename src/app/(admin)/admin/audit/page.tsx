import { requireAdmin } from "@/lib/auth";
import { getAuditLogs } from "@/lib/actions/admin";
import { AuditPageClient } from "@/components/admin/AuditPageClient";
import type { AuditLog } from "@/components/admin/AuditPageClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  // 1. Secure administrator-only access
  await requireAdmin();

  // 2. Fetch initial set of audit logs (page 1, limit 10)
  const initialData = await getAuditLogs({
    page: 1,
    limit: 10,
    search: "",
    targetType: "ALL",
    startDate: "",
    endDate: "",
  });

  return (
    <AuditPageClient 
      initialLogs={initialData.logs as AuditLog[]} 
      initialPagination={initialData.pagination} 
    />
  );
}
