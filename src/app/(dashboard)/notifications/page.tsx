 
"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Check, 
  Trash2, 
  Loader2,
  Inbox,
  Square,
  CheckSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  read: boolean;
  readAt: string | null;
  link: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("all"); // "all" | "unread" | "read"
  const [page, setPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [accumulatedNotifications, setAccumulatedNotifications] = useState<NotificationItem[]>([]);

  // Fetch paginated notifications based on current filter status and page number
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkMarkRead,
    bulkDelete
  } = useNotifications(status, page, 15);

  // Synchronize and accumulate notifications list as pages load
  useEffect(() => {
    if (page === 1) {
      setAccumulatedNotifications(notifications);
    } else {
      setAccumulatedNotifications((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const filteredNew = notifications.filter((item) => !existingIds.has(item.id));
        return [...prev, ...filteredNew];
      });
    }
  }, [notifications, page]);

  // Reset page and list on filter switch
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
    setSelectedIds([]);
    setAccumulatedNotifications([]);
  };

  const handleRowClick = async (n: NotificationItem) => {
    if (!n.read) {
      await markAsRead(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === accumulatedNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accumulatedNotifications.map((n) => n.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkMarkRead(selectedIds);
      toast.success(`Marked ${selectedIds.length} notifications as read.`);
      setSelectedIds([]);
    } catch (_err) {
      toast.error("Failed to update selected notifications.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkDelete(selectedIds);
      toast.success(`Deleted ${selectedIds.length} notifications.`);
      setSelectedIds([]);
    } catch (_err) {
      toast.error("Failed to delete selected notifications.");
    }
  };

  const getNotificationIcon = (type: "INFO" | "SUCCESS" | "WARNING" | "ERROR") => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
      case "ERROR":
        return <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notifications Center</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Stay updated with workspace events, team invitations, and billing activities.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={async () => {
              await markAllAsRead();
              toast.success("All notifications marked as read.");
            }}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors px-4 cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Control Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30">
        
        {/* Filter Tabs */}
        <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-850">
          {[
            { label: "All", value: "all" },
            { label: "Unread", value: "unread" },
            { label: "Read", value: "read" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                status === tab.value
                  ? "bg-indigo-650 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selection & Bulk Actions */}
        {accumulatedNotifications.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer"
            >
              {selectedIds.length === accumulatedNotifications.length ? (
                <CheckSquare className="h-4 w-4 text-indigo-400" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Select All</span>
            </button>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-150">
                <span className="text-xs text-zinc-500 font-medium mr-1">
                  {selectedIds.length} selected
                </span>
                
                <button
                  onClick={handleBulkMarkRead}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors px-3 cursor-pointer gap-1"
                  title="Mark selected as read"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Read</span>
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/35 text-xs font-semibold text-rose-350 transition-colors px-3 cursor-pointer gap-1"
                  title="Delete selected"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden divide-y divide-zinc-800/60">
        {accumulatedNotifications.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500 border border-zinc-800 mb-4">
              <Inbox className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-zinc-200">No notifications found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">
              You don&apos;t have any notifications matching this filter category.
            </p>
          </div>
        ) : (
          accumulatedNotifications.map((n) => {
            const isSelected = selectedIds.includes(n.id);
            return (
              <div
                key={n.id}
                onClick={() => handleRowClick(n)}
                className={`group relative flex items-start gap-4 p-4 hover:bg-zinc-900/40 transition-colors cursor-pointer ${
                  !n.read ? "bg-indigo-500/[0.01]" : ""
                }`}
              >
                {/* Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSelectOne(n.id);
                  }}
                  className="mt-0.5 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>

                {/* Unread circle badge */}
                {!n.read && (
                  <span className="absolute left-2.5 top-6 h-2 w-2 rounded-full bg-indigo-500" />
                )}

                {/* Type Icon */}
                <div className="mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold truncate ${
                      !n.read ? "text-zinc-100" : "text-zinc-400"
                    }`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="rounded-full bg-indigo-950/80 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-900/50">
                        New
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-xs mt-1 leading-relaxed max-w-3xl ${
                    !n.read ? "text-zinc-350" : "text-zinc-500"
                  }`}>
                    {n.message}
                  </p>

                  <span className="text-[10px] text-zinc-500 mt-2 block">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                    toast.success("Notification deleted.");
                  }}
                  className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-rose-450 hover:bg-zinc-900 transition-all cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}

        {/* Load More & Loading States */}
        {isLoading && (
          <div className="flex items-center justify-center p-6 text-zinc-450 text-xs gap-2">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-400" />
            Loading updates...
          </div>
        )}

        {hasMore && !isLoading && (
          <div className="p-4 text-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors px-6 cursor-pointer"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
