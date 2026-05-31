import Link from "next/link";
import { UserButton } from "@/lib/clerk-client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PageTransition } from "@/components/shared/PageTransition";
import { Shield, ChevronLeft } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Enforce super-admin database security
  const admin = await requireAdmin();

  // 2. Log Administrative access attempt to AuditLog
  try {
    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "Accessed Super-Admin Console",
        targetType: "Console",
        targetId: "ADMIN_ROOT",
        metadata: { path: "/admin" },
      },
    });
  } catch (error) {
    console.error("Failed to log admin console access:", error);
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Glowing Administrative Header */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-zinc-800 bg-zinc-900/40 backdrop-blur-md z-10">
          {/* Mobile responsive link */}
          <div className="md:hidden flex items-center">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-1 text-zinc-400 hover:text-white transition-colors text-sm font-semibold"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Super Admin Badge Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/25 bg-red-950/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]">
            <Shield className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-red-400 uppercase select-none">
              System Admin console
            </span>
          </div>

          {/* User Button */}
          <div className="flex items-center gap-4 ml-auto">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 rounded-lg ring-2 ring-red-500/30 ring-offset-2 ring-offset-zinc-900"
                }
              }}
            />
          </div>
        </header>

        {/* Dynamic Inner Layout Body */}
        <main className="flex flex-col flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-zinc-950 to-zinc-900/50">
          <PageTransition>
            <div className="max-w-7xl mx-auto space-y-8 w-full">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
