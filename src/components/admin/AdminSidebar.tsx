"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  ChevronLeft, 
  FileText,
  Settings,
  Activity,
  Globe,
  CreditCard,
  Megaphone,
  Shield
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      label: "Organizations",
      href: "/admin/organizations",
      icon: Globe,
      active: pathname.startsWith("/admin/organizations"),
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
      active: pathname.startsWith("/admin/subscriptions"),
    },
    {
      label: "Blog CMS",
      href: "/admin/blog",
      icon: FileText,
      active: pathname.startsWith("/admin/blog"),
    },
    {
      label: "Feature Flags",
      href: "/admin/features",
      icon: Settings,
      active: pathname.startsWith("/admin/features"),
    },
    {
      label: "Announcements",
      href: "/admin/announcements",
      icon: Megaphone,
      active: pathname.startsWith("/admin/announcements"),
    },
    {
      label: "Moderation Queue",
      href: "/admin/moderation",
      icon: Shield,
      active: pathname.startsWith("/admin/moderation"),
    },
    {
      label: "Security Audits",
      href: "/admin/audit",
      icon: Activity,
      active: pathname.startsWith("/admin/audit"),
    },
  ];


  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <Link 
          href="/dashboard" 
          className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-all text-sm font-medium hover:-translate-x-0.5 duration-200"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Exit Admin Panel</span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 space-y-6">
        <div className="flex items-center gap-2.5 px-3 text-red-500 font-bold text-xs uppercase tracking-widest animate-pulse">
          <ShieldAlert className="h-4 w-4" />
          <span>System Admin</span>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? "bg-gradient-to-r from-red-950/40 to-red-900/10 border border-red-900/30 text-red-200 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <Icon className={`h-5 w-5 ${item.active ? "text-red-400" : "text-zinc-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-850 bg-zinc-950/40">
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-zinc-500 font-medium">
          <Activity className="h-4 w-4 text-emerald-500 animate-spin" style={{ animationDuration: "3s" }} />
          <span>Platform Live Monitor</span>
        </div>
      </div>
    </aside>
  );
}
