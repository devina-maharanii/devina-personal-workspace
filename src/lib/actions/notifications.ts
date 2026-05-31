"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Marks a single notification as read.
 */
export async function markAsRead(notificationId: string) {
  const user = await requireAuth();

  // Find notification and ensure it belongs to the active user
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    throw new Error("Notification not found or access denied.");
  }

  const updated = await db.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  revalidatePath("/notifications");
  return updated;
}

/**
 * Marks all notifications for the current authenticated user as read.
 */
export async function markAllAsRead() {
  const user = await requireAuth();

  const result = await db.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  revalidatePath("/notifications");
  return { count: result.count };
}

/**
 * Deletes a notification.
 */
export async function deleteNotification(notificationId: string) {
  const user = await requireAuth();

  // Ensure notification belongs to the active user
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    throw new Error("Notification not found or access denied.");
  }

  await db.notification.delete({
    where: { id: notificationId },
  });

  revalidatePath("/notifications");
  return { success: true };
}

/**
 * Deletes multiple selected notifications in bulk.
 */
export async function deleteBulkNotifications(notificationIds: string[]) {
  const user = await requireAuth();

  const result = await db.notification.deleteMany({
    where: {
      id: { in: notificationIds },
      userId: user.id,
    },
  });

  revalidatePath("/notifications");
  return { count: result.count };
}

/**
 * Marks multiple selected notifications as read in bulk.
 */
export async function markBulkAsRead(notificationIds: string[]) {
  const user = await requireAuth();

  const result = await db.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId: user.id,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  revalidatePath("/notifications");
  return { count: result.count };
}

/**
 * Updates organization settings for email notifications.
 */
export async function updateEmailPreferencesAction(
  orgId: string,
  types: string[],
  digestFreq: string
) {
  const user = await requireAuth();

  // Verify user membership in organization (Owner/Admin or Member)
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: orgId,
      },
    },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new Error("Only organization Owners and Admins can update notification settings.");
  }

  // Update or upsert OrganizationSettings
  const settings = await db.organizationSettings.upsert({
    where: { organizationId: orgId },
    update: {
      emailNotificationTypes: types,
      notificationDigestFreq: digestFreq,
    },
    create: {
      organizationId: orgId,
      emailNotificationTypes: types,
      notificationDigestFreq: digestFreq,
    },
  });

  revalidatePath("/settings/notifications");
  return settings;
}
