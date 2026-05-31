"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  ValidationError,
  InternalServerError,
  NotFoundError,
  ForbiddenError,
} from "@/lib/errors";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { generateApiKey, hashApiKey } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authLimiter, checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { cookies } from "next/headers";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown) => (typeof value === "string" ? value : undefined);

const isMockAuthEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.NODE_ENV !== "test" &&
  (process.env.FORCE_MOCK_AUTH === "true" || process.env.E2E_TEST_MODE === "true");

// --- VALIDATION SCHEMAS ---

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(160).optional(),
  timezone: z.string().min(1, "Please select a timezone"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

const PasswordSchema = z.object({
  current: z.string().min(8, "Current password must be at least 8 characters"),
  new: z.string().min(8, "New password must be at least 8 characters"),
});

const ApiKeySchema = z.object({
  name: z.string().min(1, "Key name is required").max(30),
  expiresAt: z.string().optional().or(z.literal("")),
});

const NotificationPrefsSchema = z.object({
  inApp: z.boolean(),
  emailTypes: z.array(z.string()),
  digest: z.string(),
});

// --- SERVER ACTIONS ---

/**
 * Updates Name, Bio, Timezone, and optionally Profile Avatar.
 * Syncs DB and Clerk firstName/lastName.
 */
export async function updateProfile(rawData: z.infer<typeof ProfileSchema>) {
  const user = await requireAuth();

  const validated = ProfileSchema.safeParse(rawData);
  if (!validated.success) {
    throw new ValidationError(validated.error.issues[0]?.message || "Invalid inputs.");
  }

  const { name, bio, timezone, avatarUrl } = validated.data;

  // Split name for Clerk firstName / lastName
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // 1. Sync profile to Clerk
  if (!isMockAuthEnabled) {
    try {
      const client = await clerkClient();
      await client.users.updateUser(user.clerkId, {
        firstName,
        lastName,
        ...(avatarUrl ? { imageUrl: avatarUrl } : {}),
      });
     
    } catch (error: unknown) {
      console.error("Failed to sync profile change to Clerk:", error);
      throw new ValidationError(getErrorMessage(error, "Failed to update profile identity."));
    }
  }

  // 2. Sync to local Database
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      name,
      bio,
      timezone,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  revalidatePath("/settings/profile");
  return { success: true, user: updatedUser };
}

/**
 * Rotates user credentials securely via Clerk Client backend updating.
 */
export async function changePassword(rawData: z.infer<typeof PasswordSchema>) {
  const user = await requireAuth();

  const validated = PasswordSchema.safeParse(rawData);
  if (!validated.success) {
    throw new ValidationError(validated.error.issues[0]?.message || "Invalid password inputs.");
  }

  const { current: currentPassword, new: newPassword } = validated.data;

  // 1. Enforce rate limiting by IP
  const ip = await getClientIp();
  const limitRes = await checkRateLimit({
    identifier: `action-change-password-${ip}`,
    limiter: authLimiter,
  });

  if (!limitRes.success) {
    throw new ValidationError("Too many password change requests. Please try again in 1 minute.");
  }

  if (isMockAuthEnabled) {
    throw new ValidationError("Password modification is disabled in preview/mock mode.");
  }

  const client = await clerkClient();

  // 2. Verify current password
  try {
    await client.users.verifyPassword({
      userId: user.clerkId,
      password: currentPassword,
    });
   
  } catch (_verifyError: unknown) {
    console.warn("Password verification failed for user:", user.id);
    throw new ValidationError("Incorrect current password.");
  }

  // 3. Update to new password
  try {
    await client.users.updateUser(user.clerkId, {
      password: newPassword,
    });
   
  } catch (error: unknown) {
    console.error("Failed to update password in Clerk:", error);
    throw new ValidationError(
      getErrorMessage(error, "Failed to update credentials. Please check password criteria.")
    );
  }

  // Record audit trail event
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "Rotated security login credentials",
      targetType: "User",
      targetId: user.id,
    },
  });

  return { success: true };
}

/**
 * Resolves active sessions from Clerk, matching against current session ID.
 */
export async function getUserSessions() {
  const user = await requireAuth();
  const { sessionId: currentSessionId } = await auth();

  if (isMockAuthEnabled) {
    return {
      success: true,
      sessions: [
        {
          id: "mock_session_id",
          isCurrent: true,
          status: "active",
          ipAddress: "127.0.0.1",
          city: "San Francisco",
          country: "United States",
          deviceType: "Desktop",
          browserName: "Chrome",
          browserVersion: "Latest",
          osName: "macOS",
          osVersion: "15.0",
          lastActiveAt: new Date(),
          createdAt: new Date(),
        },
      ],
    };
  }

  try {
    const client = await clerkClient();
    const sessions = await client.sessions.getSessionList({
      userId: user.clerkId,
    });

    const mappedSessions = sessions.data.map((sess) => {
      // Extract latest device/browser metadata
      const activity: Record<string, unknown> = isRecord(sess.latestActivity) ? sess.latestActivity : {};
      return {
        id: sess.id,
        isCurrent: sess.id === currentSessionId,
        status: sess.status,
        ipAddress: getString(activity.ipAddress) || "Unknown IP",
        city: getString(activity.city) || "Unknown Location",
        country: getString(activity.country) || "",
        deviceType: getString(activity.deviceType) || "Unknown Device",
        browserName: getString(activity.browserName) || "Unknown Browser",
        browserVersion: getString(activity.browserVersion) || "",
        osName: getString(activity.osName) || "Unknown OS",
        osVersion: getString(activity.osVersion) || "",
        lastActiveAt: sess.lastActiveAt ? new Date(sess.lastActiveAt) : new Date(sess.updatedAt),
        createdAt: new Date(sess.createdAt),
      };
    });

    return { success: true, sessions: mappedSessions };
   
  } catch (error: unknown) {
    console.error("Failed to query Clerk sessions:", error);
    throw new InternalServerError("Failed to fetch active device connections.");
  }
}

/**
 * Terminate/Revoke specific Clerk session.
 */
export async function revokeUserSession(sessionId: string) {
  const user = await requireAuth();

  if (isMockAuthEnabled) {
    return { success: true };
  }

  try {
    const client = await clerkClient();

    // Verify session ownership (BUG-8)
    const sessions = await client.sessions.getSessionList({ userId: user.clerkId });
    const isOwner = sessions.data.some((s) => s.id === sessionId);
    if (!isOwner) {
      throw new ForbiddenError("Cannot revoke sessions belonging to other users.");
    }

    await client.sessions.revokeSession(sessionId);
   
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) throw error;
    console.error("Failed to revoke session in Clerk:", error);
    throw new InternalServerError("Failed to terminate session.");
  }

  // Log audit
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Revoked active device session: ${sessionId}`,
      targetType: "User",
      targetId: user.id,
    },
  });

  return { success: true };
}

/**
 * Generates a cryptographically secure, timing-safe API key.
 * Stores in database as a SHA-256 hash. Returns raw key ONLY ONCE.
 */
export async function generateUserApiKey(rawData: z.infer<typeof ApiKeySchema>) {
  const user = await requireAuth();

  const validated = ApiKeySchema.safeParse(rawData);
  if (!validated.success) {
    throw new ValidationError(validated.error.issues[0]?.message || "Invalid API key params.");
  }

  const { name, expiresAt } = validated.data;

  // Resolve active organization membership
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    select: { organizationId: true },
  });

  if (memberships.length === 0) {
    throw new NotFoundError("No active organization workspaces found to link credentials.");
  }

  const orgId = memberships[0].organizationId; // Bind key to first active workspace

  // Create Key Pair: Raw for copying, prefix, and hashed secret for DB timing-safe lookup
  const rawKey = generateApiKey("ak");
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.split("_")[0] + "_" + rawKey.split("_")[1].slice(0, 6);

  const expirationDate = expiresAt ? new Date(expiresAt) : null;

  const keyRecord = await db.apiKey.create({
    data: {
      userId: user.id,
      orgId,
      name,
      keyHash,
      keyPrefix,
      expiresAt: expirationDate,
    },
  });

  // Log audit trail
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Generated external developer API key: ${name}`,
      targetType: "ApiKey",
      targetId: keyRecord.id,
    },
  });

  revalidatePath("/settings/api-keys");
  return { success: true, rawKey, key: keyRecord };
}

/**
 * Lists user generated active developer credentials.
 */
export async function getUserApiKeys() {
  const user = await requireAuth();

  const keys = await db.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, keys };
}

/**
 * Revokes / Deletes generated developer API credentials.
 */
export async function revokeUserApiKey(keyId: string) {
  const user = await requireAuth();

  const key = await db.apiKey.findFirst({
    where: { id: keyId, userId: user.id },
  });

  if (!key) {
    throw new ForbiddenError("API credential not found or unauthorized.");
  }

  await db.apiKey.delete({
    where: { id: keyId },
  });

  // Log audit trail
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Revoked external developer API key: ${key.name}`,
      targetType: "ApiKey",
      targetId: keyId,
    },
  });

  revalidatePath("/settings/api-keys");
  return { success: true };
}

/**
 * Updates in-app alerts and email types preference.
 */
export async function updateNotificationPrefs(rawData: z.infer<typeof NotificationPrefsSchema>) {
  const user = await requireAuth();

  const validated = NotificationPrefsSchema.safeParse(rawData);
  if (!validated.success) {
    throw new ValidationError(validated.error.issues[0]?.message || "Invalid preferences.");
  }

  const { inApp, emailTypes, digest } = validated.data;

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      inAppNotifications: inApp,
      emailNotificationTypes: emailTypes,
      notificationDigestFreq: digest,
    },
  });

  revalidatePath("/settings/notifications");
  return { success: true, user: updatedUser };
}

/**
 * Compiles and returns complete user context, GDPR compliance data export.
 */
export async function exportUserData() {
  const user = await requireAuth();

  // Query ALL associated user footprints across the tables
  const [
    profile,
    memberships,
    files,
    apiKeys,
    auditLogs,
    notifications,
    blogPosts,
    conversations
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        bio: true,
        timezone: true,
        role: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    }),
    db.membership.findMany({
      where: { userId: user.id },
      include: { organization: { select: { name: true, slug: true } } },
    }),
    db.file.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, url: true, size: true, mimeType: true, createdAt: true },
    }),
    db.apiKey.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, keyPrefix: true, createdAt: true, expiresAt: true },
    }),
    db.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    db.notification.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, message: true, type: true, read: true, createdAt: true },
      take: 500,
    }),
    db.blogPost.findMany({
      where: { authorId: user.id },
      select: { id: true, title: true, slug: true, published: true, createdAt: true },
    }),
    db.conversation.findMany({
      where: { userId: user.id },
      include: { messages: { select: { role: true, content: true, createdAt: true }, take: 50 } },
      take: 100,
    }),
  ]);

  const exportPayload = {
    generatedAt: new Date().toISOString(),
    compliance: "GDPR - Article 15 (Right of Access)",
    data: {
      profile,
      workspaces: memberships.map((m) => ({
        role: m.role,
        workspaceName: m.organization.name,
        workspaceSlug: m.organization.slug,
        joinedAt: m.createdAt,
      })),
      files,
      apiKeys,
      conversations,
      blogPosts,
      notifications,
      auditLogs,
    },
  };

  return exportPayload;
}

/**
 * Permanently prunes user footprint: Subscriptions, memberships, files, credentials, Clerk profile.
 */
export async function deleteUserAccount(confirmText: string) {
  const user = await requireAuth();

  if (confirmText !== "delete my account") {
    throw new ForbiddenError("Security verification failed. Please enter the precise text matching 'delete my account'.");
  }

  // 1. Terminate stripe subscriptions if active. Must succeed before proceeding (BUG-9).
  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (error) {
      console.error("Failed to cancel stripe subscription during account delete:", error);
      throw new ValidationError("Failed to cancel your active Stripe subscription. Account deletion aborted. Please contact support.");
    }
  }

  // 2. Clean up user files from UploadThing
  try {
    const userFiles = await db.file.findMany({
      where: { userId: user.id },
      select: { key: true },
    });
    if (userFiles.length > 0) {
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi();
      await utapi.deleteFiles(userFiles.map((f) => f.key));
    }
  } catch (fileErr) {
    console.error("Failed to purge user files from UploadThing during deletion:", fileErr);
    // Non-blocking, continue with deletion
  }

  // 3. Cascade delete Clerk Profile
  if (isMockAuthEnabled) {
    const cookieStore = await cookies();
    cookieStore.delete("mock_session");
  } else {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(user.clerkId);
    } catch (error: unknown) {
      console.error("Failed to delete Clerk profile:", error);
      throw new InternalServerError(getErrorMessage(error, "Failed to purge identity profiles."));
    }
  }

  // 4. Soft-delete user in DB (BUG-9)
  await db.user.update({
    where: { id: user.id },
    data: {
      deletedAt: new Date(),
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      stripePriceId: null,
      subscriptionStatus: "CANCELED",
    },
  });

  return { success: true };
}
