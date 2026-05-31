import { requireAuth, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";
import { cache, CACHE_KEYS } from "@/lib/redis";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/shared/DashboardSidebar";
import DashboardHeader from "@/components/shared/DashboardHeader";
import GlobalAnnouncementBanner from "@/components/shared/GlobalAnnouncementBanner";
import DashboardLayoutWrapper from "@/components/shared/DashboardLayoutWrapper";
import MobileNav from "@/components/shared/MobileNav";
import { PageTransition } from "@/components/shared/PageTransition";

export const dynamic = "force-dynamic";

/**
 * DashboardLayout protects all dashboard sub-routes under the (dashboard) group.
 * Asserts active auth states on the server, aggregates organizational relationships,
 * and retrieves scheduled site announcements.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Authenticate user session
  const user = await requireAuth();

  // Set Sentry user context for server runtime
  Sentry.setUser({ id: user.id, email: user.email });

  // 2. Fetch active organization scope
  const activeOrg = await getActiveOrg(user.id);

  // 3. Fetch user's organization memberships (cached 60 s)
  const memberships = await cache(
    CACHE_KEYS.userMemberships(user.id),
    () =>
      db.membership.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    60,
  );

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  // 4. Query active system-wide announcements (cached 60 s)
  const activeAnnouncement = await cache(
    CACHE_KEYS.activeAnnouncement(),
    () =>
      db.announcement.findFirst({
        where: {
          active: true,
          AND: [
            {
              OR: [
                { startsAt: null },
                { startsAt: { lte: new Date() } },
              ],
            },
            {
              OR: [
                { endsAt: null },
                { endsAt: { gte: new Date() } },
              ],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    60,
  );

  const sidebarUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    subscriptionStatus: user.subscriptionStatus,
    stripePriceId: user.stripePriceId,
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden pb-16 md:pb-0">
      {/* Collapsible Sidebar */}
      <DashboardSidebar user={sidebarUser} />

      {/* Main Layout Area */}
      <DashboardLayoutWrapper>
        {/* Top Header Navigation */}
        <DashboardHeader memberships={memberships} activeOrg={activeOrg} />

        {/* Global Announcement Alert Banner */}
        {activeAnnouncement && (
          <GlobalAnnouncementBanner
            announcement={{
              id: activeAnnouncement.id,
              title: activeAnnouncement.title,
              message: activeAnnouncement.message,
              type: activeAnnouncement.type,
            }}
          />
        )}

        {/* Page Children Container */}
        <main id="main-content" className="flex flex-col flex-1 overflow-y-auto p-4 md:p-8 bg-background text-foreground">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </DashboardLayoutWrapper>
      
      {/* Mobile Navigation Tab Bar */}
      <MobileNav />
    </div>
  );
}
