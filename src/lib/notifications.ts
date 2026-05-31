import { db } from "./db";
import { sendTransactionalEmail } from "./resend";
import React from 'react';
import { logger } from "./logger";
import { NotificationType } from "@prisma/client";
import { publishToUser } from "./realtime";

interface CreateNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
  link?: string;
  category?: "invite" | "billing" | "credits" | "members" | "files" | "blog";
}

// React Email Component Creator for generic notifications
function NotificationEmailTemplate({ title, message, link }: { title: string; message: string; link?: string }) {
  const finalLink = link 
    ? (link.startsWith("http") ? link : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}`)
    : null;

  return React.createElement(
    "div",
    {
      style: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "32px",
        backgroundColor: "#09090b",
        color: "#f4f4f5",
        borderRadius: "16px",
        border: "1px solid #27272a",
        maxWidth: "600px",
        margin: "0 auto",
      },
    },
    React.createElement(
      "h2",
      { style: { fontSize: "20px", fontWeight: "bold", color: "#ffffff", marginBottom: "12px" } },
      title
    ),
    React.createElement(
      "p",
      { style: { fontSize: "14px", color: "#a1a1aa", lineHeight: "1.6", marginBottom: "24px" } },
      message
    ),
    finalLink && React.createElement(
      "a",
      {
        href: finalLink,
        style: {
          display: "inline-block",
          padding: "10px 20px",
          backgroundColor: "#6366f1",
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          fontSize: "13px",
        },
      },
      "View Details"
    ),
    React.createElement(
      "p",
      { style: { marginTop: "32px", fontSize: "11px", color: "#52525b", borderTop: "1px solid #27272a", paddingTop: "16px" } },
      "You are receiving this because email notifications are enabled in your workspace preferences."
    )
  );
}



/**
 * Helper to check user preferences and dispatch an email asynchronously.
 */
async function createNotificationEmailTrigger(userId: string, options: Omit<CreateNotificationOptions, "userId">) {
  const { title, message, link, category } = options;
  if (!category) return; // Only send email if a category is provided

  try {
    // 1. Resolve user email + memberships settings
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                settings: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.email) return;

    // Check if the user has any organization settings enabling this email category immediately
    for (const membership of user.memberships) {
      const settings = membership.organization.settings;
      if (!settings) continue;

      if (!settings.emailNotifications) continue;

      const enabledTypes = (settings.emailNotificationTypes as string[]) || [];
      const matchesCategory = enabledTypes.includes(category);
      const isImmediate = settings.notificationDigestFreq === "immediate";

      if (matchesCategory && isImmediate) {
        // Send email immediately
        await sendTransactionalEmail(
          user.email,
          `Alert: ${title}`,
          NotificationEmailTemplate,
          { title, message, link }
        );
        break; // Stop after sending once
      }
    }
  } catch (error) {
    logger.error({ error, userId, category }, "Failed to dispatch notification email trigger");
  }
}

/**
 * Creates an in-app database notification for a user.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link,
  category,
}: CreateNotificationOptions) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type.toUpperCase() as NotificationType,
        link: link || null,
      },
    });

    await publishToUser(userId, 'notification', notification);

    // Handle email triggers in the background
    createNotificationEmailTrigger(userId, { title, message, type, link, category }).catch((err) => {
      logger.error({ err, userId }, "Notification email dispatch failed");
    });

    return notification;
  } catch (error) {
    logger.error({ error, userId }, "Failed to create in-app notification");
    throw error;
  }
}

/**
 * Creates bulk notifications for multiple users.
 */
export async function createBulkNotifications(
  userIds: string[],
  options: Omit<CreateNotificationOptions, "userId">
) {
  const type = (options.type || "info").toUpperCase() as NotificationType;

  const data = userIds.map((userId) => ({
    userId,
    title: options.title,
    message: options.message,
    type,
    link: options.link || null,
  }));

  try {
    const notifications = await db.notification.createMany({
      data,
    });

    for (const notificationData of data) {
      await publishToUser(notificationData.userId, 'notification', notificationData);
    }

    // Dispatch background email triggers
    for (const userId of userIds) {
      createNotificationEmailTrigger(userId, options).catch((err) => {
        logger.error({ err, userId }, "Bulk notification email dispatch failed");
      });
    }

    return notifications;
  } catch (error) {
    logger.error({ error, userIds }, "Failed to create bulk notifications");
    throw error;
  }
}
