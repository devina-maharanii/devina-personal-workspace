import { requireAdmin } from "@/lib/auth";
import { getAllUsers } from "@/lib/actions/admin";
import { UsersPageClient } from "@/components/admin/UsersPageClient";

export default async function AdminUsersPage() {
  // 1. Secure administrator-only access
  await requireAdmin();

  // 2. Fetch initial page 1 dataset from PostgreSQL
  const initialData = await getAllUsers({
    page: 1,
    limit: 10,
    search: "",
    role: "ALL",
    plan: "ALL",
    status: "ALL",
  });

  return (
    <UsersPageClient 
      initialUsers={initialData.users} 
      initialPagination={initialData.pagination} 
    />
  );
}
