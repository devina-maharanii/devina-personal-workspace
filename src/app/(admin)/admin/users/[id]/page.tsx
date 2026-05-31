/* eslint-disable react-hooks/error-boundaries */
import { requireAdmin } from "@/lib/auth";
import { getUserDetails } from "@/lib/actions/admin";
import { UserInspectorClient } from "@/components/admin/UserInspectorClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  // 1. Secure administrator-only access
  await requireAdmin();

  // 2. Await dynamic route parameter in Next.js 15/16
  const { id } = await params;

  try {
    // 3. Fetch comprehensive user inspector details
    const userDetails = await getUserDetails(id);
    
    return (
      <UserInspectorClient user={userDetails} />
    );
  } catch (error) {
    console.error("Failed to load user details for administration:", error);
    notFound();
  }
}
