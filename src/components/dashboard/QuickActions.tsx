"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, UploadCloud, UserPlus, FileEdit } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "New AI Request",
      desc: "Prompt the sandbox playground.",
      href: "/dashboard",
      icon: Sparkles,
      color: "text-indigo-400 group-hover:text-indigo-300",
      bg: "group-hover:bg-indigo-500/10",
      border: "hover:border-indigo-500/30",
    },
    {
      title: "Upload File",
      desc: "Store assets into organization storage.",
      href: "/settings",
      icon: UploadCloud,
      color: "text-purple-400 group-hover:text-purple-300",
      bg: "group-hover:bg-purple-500/10",
      border: "hover:border-purple-500/30",
    },
    {
      title: "Invite Member",
      desc: "Grow your collaboration team.",
      href: "/settings",
      icon: UserPlus,
      color: "text-pink-400 group-hover:text-pink-300",
      bg: "group-hover:bg-pink-500/10",
      border: "hover:border-pink-500/30",
    },
    {
      title: "New Blog Post",
      desc: "Create and publish CMS stories.",
      href: "/admin/blog",
      icon: FileEdit,
      color: "text-amber-400 group-hover:text-amber-300",
      bg: "group-hover:bg-amber-500/10",
      border: "hover:border-amber-500/30",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg text-white">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((act, index) => {
          const Icon = act.icon;
          return (
            <motion.div
              key={act.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={act.href}
                className={`group flex items-start gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 transition-all duration-300 ${act.border} block h-full`}
              >
                <div
                  className={`p-3 rounded-xl bg-zinc-950 border border-zinc-850 transition-all duration-300 shrink-0 ${act.bg}`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${act.color}`} />
                </div>
                <div className="space-y-1 pt-0.5">
                  <h3 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors">
                    {act.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-normal group-hover:text-zinc-400 transition-colors">
                    {act.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
