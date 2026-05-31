"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Info, CheckCircle2, AlertTriangle, AlertOctagon, ExternalLink, Check, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load the first 10 notifications for the bell dropdown
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    isLoading 
  } = useNotifications("all", 1, 10);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (id: string, read: boolean, link: string | null) => {
    if (!read) {
      await markAsRead(id);
    }
    setIsOpen(false);
    if (link) {
      router.push(link);
    }
  };

  const getNotificationIcon = (type: "INFO" | "SUCCESS" | "WARNING" | "ERROR") => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />;
      case "WARNING":
        return <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0" />;
      case "ERROR":
        return <AlertOctagon className="h-4.5 w-4.5 text-rose-400 shrink-0" />;
      default:
        return <Info className="h-4.5 w-4.5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white transition-all hover:bg-zinc-800/80 focus:outline-none cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-zinc-950 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 md:w-96 origin-top-right rounded-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl p-2 shadow-xl ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 pb-3">
            <div>
              <h3 className="font-semibold text-sm text-white">Notifications</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {unreadCount} unread message{unreadCount !== 1 && "s"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List content */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-800/40 my-1 custom-scrollbar">
            {isLoading && notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center gap-2 text-zinc-400 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-1.5 text-zinc-500 text-xs">
                <Bell className="h-8 w-8 text-zinc-700 stroke-[1.5]" />
                You are all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.read, n.link)}
                  className={`group relative flex items-start gap-3 p-3 transition-colors hover:bg-zinc-900/50 cursor-pointer ${
                    !n.read ? "bg-indigo-500/[0.02]" : ""
                  }`}
                >
                  {/* Unread circle indicator */}
                  {!n.read && (
                    <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-indigo-500" />
                  )}

                  {/* Icon */}
                  <div className="mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className={`text-xs font-semibold truncate ${
                      !n.read ? "text-zinc-100" : "text-zinc-350"
                    }`}>
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-zinc-500 mt-1 block">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Individual Delete Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/40 transition-all cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer View All Link */}
          <div className="border-t border-zinc-800/60 pt-2 pb-1">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-center text-xs text-zinc-400 hover:text-white transition-colors font-medium"
            >
              <span>View all notifications</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
