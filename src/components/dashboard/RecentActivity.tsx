/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Activity, Sparkles, UploadCloud, UserPlus, FileEdit, HelpCircle } from "lucide-react";
import { useRealtimeStore } from "@/stores/realtimeStore";
import { motion, AnimatePresence } from "framer-motion";
import { SLIDE_UP, FADE_IN } from "@/lib/animations";

export interface ActivityItem {
  id: string;
  action: string;
  createdAt: Date | string;
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities: initialActivities }: RecentActivityProps) {
  const liveActivities = useRealtimeStore((state) => state.activities);
  const combinedActivities = [...liveActivities, ...initialActivities].slice(0, 8);

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("ai") || act.includes("generate") || act.includes("prompt")) {
      return { icon: Sparkles, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
    }
    if (act.includes("file") || act.includes("upload")) {
      return { icon: UploadCloud, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
    }
    if (act.includes("member") || act.includes("invite") || act.includes("onboarding")) {
      return { icon: UserPlus, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" };
    }
    if (act.includes("post") || act.includes("blog") || act.includes("publish")) {
      return { icon: FileEdit, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    }
    return { icon: HelpCircle, color: "text-zinc-400 bg-zinc-550/10 border-zinc-500/20" };
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-indigo-400" />
          <h2 className="font-semibold text-lg text-white">Recent Activity</h2>
        </div>
        <Link
          href="/settings"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all
        </Link>
      </div>

      <AnimatePresence mode="popLayout">
        {combinedActivities.length === 0 ? (
          <motion.div
            key="empty"
            variants={FADE_IN}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-2"
          >
            <Activity className="h-8 w-8 text-zinc-600 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-400">No recent activities</p>
            <p className="text-xs text-zinc-500">Perform actions inside your workspace to log events.</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={FADE_IN}
            initial="hidden"
            animate="visible"
            className="space-y-4 divide-y divide-zinc-900 flex-1 overflow-y-auto max-h-[380px] pr-1"
          >
            <AnimatePresence mode="popLayout">
              {combinedActivities.map((item, idx) => {
                const { icon: Icon, color } = getActionIcon(item.action);
                const userDisplay = item.user?.name || item.user?.email.split("@")[0] || "System";
                const dateParsed = typeof item.createdAt === "string" ? parseISO(item.createdAt) : item.createdAt;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    variants={SLIDE_UP}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`flex items-start gap-3 py-3 ${idx === 0 ? "pt-0" : ""}`}
                  >
                    {/* User avatar or category icon fallback */}
                    <div className="relative shrink-0">
                      {item.user?.avatarUrl ? (
                        <img
                          src={item.user.avatarUrl}
                          alt={userDisplay}
                          className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center font-bold text-xs text-zinc-400">
                          {userDisplay.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {/* Miniature category badge */}
                      <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border shrink-0 ${color}`}>
                        <Icon className="h-2 w-2" />
                      </span>
                    </div>

                    <div className="space-y-0.5 grow min-w-0">
                      <p className="text-xs text-zinc-300 font-medium leading-normal break-words">
                        <span className="font-bold text-white mr-1">{userDisplay}</span>
                        {item.action}
                      </p>
                      <span className="text-[10px] text-zinc-550 block">
                        {formatDistanceToNow(dateParsed, { addSuffix: true })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

