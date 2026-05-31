"use client";

import useSWR from "swr";
import {
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  markBulkAsRead as apiMarkBulkAsRead,
  deleteBulkNotifications as apiDeleteBulkNotifications,
} from "@/lib/actions/notifications";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

interface NotificationsApiResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export function useNotifications(status = "all", page = 1, limit = 10, cursor?: string | null) {
  const key = `/api/notifications?status=${status}&page=${page}&limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<NotificationsApiResponse>(
    key,
    fetcher,
    {
      refreshInterval: 30000, // Refresh notifications every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const unreadCount = data?.unreadCount || 0;
  const hasMore = data?.hasMore || false;
  const nextCursor = data?.nextCursor || null;

  /**
   * Mark a single notification as read.
   */
  const markAsRead = async (id: string) => {
    // Optimistic UI mutation
    await mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          notifications: current.notifications.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, current.unreadCount - 1),
        };
      },
      { revalidate: false }
    );

    try {
      await apiMarkAsRead(id);
      await mutate();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      await mutate(); // Rollback to actual state
    }
  };

  /**
   * Mark all notifications as read.
   */
  const markAllAsRead = async () => {
    // Optimistic UI mutation
    await mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          notifications: current.notifications.map((n) => ({
            ...n,
            read: true,
            readAt: new Date().toISOString(),
          })),
          unreadCount: 0,
        };
      },
      { revalidate: false }
    );

    try {
      await apiMarkAllAsRead();
      await mutate();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      await mutate();
    }
  };

  /**
   * Delete a notification.
   */
  const deleteNotification = async (id: string) => {
    // Optimistic UI mutation
    await mutate(
      (current) => {
        if (!current) return current;
        const target = current.notifications.find((n) => n.id === id);
        const wasUnread = target && !target.read;
        return {
          ...current,
          notifications: current.notifications.filter((n) => n.id !== id),
          total: Math.max(0, current.total - 1),
          unreadCount: wasUnread ? Math.max(0, current.unreadCount - 1) : current.unreadCount,
        };
      },
      { revalidate: false }
    );

    try {
      await apiDeleteNotification(id);
      await mutate();
    } catch (err) {
      console.error("Failed to delete notification:", err);
      await mutate();
    }
  };

  /**
   * Bulk mark selected notifications as read.
   */
  const bulkMarkRead = async (ids: string[]) => {
    // Optimistic UI mutation
    await mutate(
      (current) => {
        if (!current) return current;
        let readChange = 0;
        const nextList = current.notifications.map((n) => {
          if (ids.includes(n.id) && !n.read) {
            readChange++;
            return { ...n, read: true, readAt: new Date().toISOString() };
          }
          return n;
        });
        return {
          ...current,
          notifications: nextList,
          unreadCount: Math.max(0, current.unreadCount - readChange),
        };
      },
      { revalidate: false }
    );

    try {
      await apiMarkBulkAsRead(ids);
      await mutate();
    } catch (err) {
      console.error("Failed to bulk mark read:", err);
      await mutate();
    }
  };

  /**
   * Bulk delete selected notifications.
   */
  const bulkDelete = async (ids: string[]) => {
    // Optimistic UI mutation
    await mutate(
      (current) => {
        if (!current) return current;
        const targets = current.notifications.filter((n) => ids.includes(n.id));
        const unreadCountChange = targets.filter((n) => !n.read).length;
        const nextList = current.notifications.filter((n) => !ids.includes(n.id));
        return {
          ...current,
          notifications: nextList,
          total: Math.max(0, current.total - ids.length),
          unreadCount: Math.max(0, current.unreadCount - unreadCountChange),
        };
      },
      { revalidate: false }
    );

    try {
      await apiDeleteBulkNotifications(ids);
      await mutate();
    } catch (err) {
      console.error("Failed to bulk delete notifications:", err);
      await mutate();
    }
  };

  return {
    notifications,
    total,
    unreadCount,
    hasMore,
    nextCursor,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkMarkRead,
    bulkDelete,
    mutate,
  };
}
