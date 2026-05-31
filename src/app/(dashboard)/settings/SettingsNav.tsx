"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Key,
  Webhook,
  Puzzle,
  AlertTriangle,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  hash?: string;
  icon: typeof User;
  danger?: boolean;
};

const navItems: NavItem[] = [
  {
    label: "Account Profile",
    href: "/settings/profile",
    icon: User,
  },
  {
    label: "Login & Security",
    href: "/settings/security",
    icon: Shield,
  },
  {
    label: "Notifications preferences",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    label: "Plan & Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    label: "Developer API Keys",
    href: "/settings/api-keys",
    icon: Key,
  },
  {
    label: "Webhooks Config",
    href: "/settings/organization",
    hash: "#webhooks",
    icon: Webhook,
  },
  {
    label: "Integrations & Tools",
    href: "/settings/organization",
    hash: "#integrations",
    icon: Puzzle,
  },
  {
    label: "Danger Zone",
    href: "/settings/danger",
    icon: AlertTriangle,
    danger: true,
  },
];

export default function SettingsNav() {
  const pathname = usePathname();
  const hash = typeof window !== "undefined" ? window.location.hash : "";

  return (
    <nav className="flex flex-row lg:flex-col overflow-x-auto hide-scrollbar space-x-2 lg:space-x-0 lg:space-y-1 pb-1 lg:pb-0 px-2 lg:px-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isSelected = item.hash
          ? pathname === item.href && hash === item.hash
          : pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.hash ? `${item.href}${item.hash}` : item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
              isSelected
                ? item.danger
                  ? "bg-red-950/20 border border-red-500/20 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.05)]"
                  : "bg-zinc-850 border border-zinc-800 text-white shadow-sm"
                : item.danger
                  ? "text-red-550 hover:bg-red-950/10 hover:text-red-400 border border-transparent"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20 border border-transparent"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                isSelected
                  ? item.danger
                    ? "text-red-400"
                    : "text-indigo-400"
                  : item.danger
                    ? "text-red-650"
                    : "text-zinc-550"
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
