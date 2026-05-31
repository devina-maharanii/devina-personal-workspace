import { getAllReports } from "@/lib/actions/admin";
import { ModerationPageClient } from "@/components/admin/ModerationPageClient";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Content Moderation | Admin Dashboard",
  description: "Secure moderation queue for super-admins to inspect reported community content.",
  noIndex: true,
});

/**
 * Server page component that resolves active reported content.
 */
export default async function AdminModerationPage() {
  // Query reported items in moderation queue
  const result = await getAllReports({
    page: 1,
    limit: 50,
  });

  return (
    <ModerationPageClient 
      initialReports={result.reports} 
      initialPagination={result.pagination} 
    />
  );
}
