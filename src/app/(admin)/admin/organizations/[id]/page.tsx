/* eslint-disable react-hooks/error-boundaries */
import { getOrganizationDetails } from "@/lib/actions/admin";
import { OrgInspectorClient } from "@/components/admin/OrgInspectorClient";
import { notFound } from "next/navigation";

interface AdminOrgDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

/**
 * Server page component that resolves detailed organization metrics by ID.
 */
export default async function AdminOrgDetailPage({ params }: AdminOrgDetailPageProps) {
  const { id } = await params;
  
  try {
    const org = await getOrganizationDetails(id);
    return <OrgInspectorClient org={org} />;
  } catch (error) {
    console.error("Failed to load organization detail:", error);
    notFound();
  }
}
