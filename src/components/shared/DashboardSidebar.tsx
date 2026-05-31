"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { APP_NAME } from "@/lib/constants";
import {
  LayoutDashboard,
  Brain,
  BarChart3,
  BookOpen,
  FileCode,
  FolderOpen,
  Webhook,
  Blocks,
  KeyRound,
  Users,
  CreditCard,
  Settings,
  Bell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Terminal,
  Image,
  Building,
} from "lucide-react";
import { UserButton } from "@/lib/clerk-client";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    subscriptionStatus: string;
    stripePriceId: string | null;
  };
}

/**
 * DashboardSidebar serves hierarchical navigation items grouped by contexts.
 * Collapses to mini-icons on desktop, and transitions to drawer-menus on mobile.
 */
export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    toggleSidebar,
    setSidebarOpen,
  } = useUIStore();

  const getPlanBadge = () => {
    const status = user.subscriptionStatus;
    const priceId = user.stripePriceId;

    if (status !== "ACTIVE" && status !== "TRIALING") {
      return (
        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xxs font-semibold text-muted-foreground ring-1 ring-inset ring-border">
          Free
        </span>
      );
    }
    if (priceId?.includes("enterprise")) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xxs font-semibold text-amber-555 dark:text-amber-400 ring-1 ring-inset ring-amber-500/30">
          Enterprise
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xxs font-semibold text-primary ring-1 ring-inset ring-primary/20">
        Pro
      </span>
    );
  };

  const navGroups = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "AI Suite",
      items: [
        { label: "AI Sandbox", href: "/ai", icon: Brain },
        { label: "Summarizer", href: "/ai/summarize", icon: FileText },
        { label: "Content Generator", href: "/ai/generate", icon: Sparkles },
        { label: "Vision Analysis", href: "/ai/vision", icon: Image },
        { label: "Prompt Library", href: "/ai/prompts", icon: Terminal },
      ],
    },
    {
      title: "Content",
      items: [
        { label: "Blog", href: "/dashboard/blog", icon: BookOpen },
        { label: "CMS", href: "/dashboard/cms", icon: FileCode },
        { label: "Files", href: "/dashboard/files", icon: FolderOpen },
      ],
    },
    {
      title: "Tools",
      items: [
        { label: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
        { label: "Integrations", href: "/dashboard/integrations", icon: Blocks },
        { label: "API Keys", href: "/dashboard/apikeys", icon: KeyRound },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Team", href: "/team", icon: Users },
        { label: "Billing", href: "/billing", icon: CreditCard },
        { label: "Workspace Settings", href: "/settings/organization", icon: Building },
        { label: "Profile Settings", href: "/settings", icon: Settings },
        { label: "Notifications Feed", href: "/notifications", icon: Bell },
        { label: "Notification Settings", href: "/settings/notifications", icon: Bell },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border text-foreground select-none">
      {/* Top Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30 shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-extrabold"
            >
              {APP_NAME}
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!sidebarCollapsed && (
              <h4 className="px-3 text-xxs font-bold text-muted-foreground/80 uppercase tracking-widest mb-2">
                {group.title}
              </h4>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer User card & collapse actions */}
      <div className="p-3 border-t border-border bg-background/40 space-y-2">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 border border-border/40">
          <UserButton />
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-xs font-bold truncate text-foreground/90">
                {user.name || user.email.split("@")[0]}
              </span>
              <div className="mt-0.5">{getPlanBadge()}</div>
            </motion.div>
          )}
        </div>

        {/* Desktop Collapse button */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-full items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          {sidebarCollapsed ? (
            <>
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? "5rem" : "16rem" }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="hidden md:flex flex-col inset-y-0 left-0 z-50 h-screen shrink-0 overflow-hidden"
    >
      {sidebarContent}
    </motion.aside>
  );
}

export default DashboardSidebar;
