import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AnnouncementsPageClient } from "@/components/admin/AnnouncementsPageClient";

export const dynamic = "force-dynamic";

/**
 * Server page component that resolves active site-wide announcements.
 */
export default async function AdminAnnouncementsPage() {
  // Enforce administrative privileges
  await requireAdmin();

  // Query all announcement logs ordered by descending creation dates
  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <AnnouncementsPageClient initialAnnouncements={announcements} />;
}
