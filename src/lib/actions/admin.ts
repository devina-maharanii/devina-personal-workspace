"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";
import { AnnouncementType, Prisma, SubscriptionStatus, UserRole } from "@prisma/client";
import { PLANS, getPlanByPriceId, stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";
import { z } from "zod";

const RoleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(UserRole),
});

const SuspendSchema = z.object({
  userId: z.string().uuid(),
  suspend: z.boolean(),
});

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  plan?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Get all users with pagination, filters, and search query.
 */
export async function getAllUsers(params: GetUsersParams) {
   
  const _admin = await requireAdmin();

  const page = params.page || 1;
  const limit = params.limit || 10;
  const search = params.search || "";
  const role = params.role || "ALL";
  const plan = params.plan || "ALL";
  const status = params.status || "ALL";
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = params.sortOrder || "desc";

  const skip = (page - 1) * limit;

  // Build prisma query filters
   
  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { clerkId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role !== "ALL") {
    where.role = role as UserRole;
  }

  if (plan !== "ALL") {
    if (plan === "FREE") {
      where.stripePriceId = null;
    } else if (plan === "PRO") {
      where.stripePriceId = {
        in: [
          PLANS.PRO.priceId,
          PLANS.PRO.priceIdAnnual,
          "price_1ProPlan_Placeholder",
          "price_1ProPlanAnnual_Placeholder",
        ],
      };
    } else if (plan === "ENTERPRISE") {
      where.stripePriceId = {
        in: [
          PLANS.ENTERPRISE.priceId,
          PLANS.ENTERPRISE.priceIdAnnual,
          "price_1EnterprisePlan_Placeholder",
          "price_1EnterprisePlanAnnual_Placeholder",
        ],
      };
    }
  }

  if (status === "ACTIVE") {
    where.deletedAt = null;
  } else if (status === "SUSPENDED") {
    where.deletedAt = { not: null };
  }

  // Get users and count total
  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        memberships: {
          select: {
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  // Map user structure with active Plan objects
  const mappedUsers = users.map((user) => {
    const activePlan = getPlanByPriceId(user.stripePriceId || "");
    return {
      ...user,
      plan: activePlan,
      status: user.deletedAt ? "SUSPENDED" : "ACTIVE",
    };
  });

  return {
    users: mappedUsers,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Fetch detailed user profile information including AI logs, files, organizations, and audit logs.
 */
export async function getUserDetails(userId: string) {
   
  const _admin = await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
      files: {
        orderBy: { createdAt: "desc" },
      },
      aiUsageLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // Fetch all audit logs where user is actor or the target of the audit log
  const auditLogs = await db.auditLog.findMany({
    where: {
      OR: [
        { userId: user.id },
        {
          AND: [
            { targetType: "User" },
            { targetId: user.id },
          ],
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  const activePlan = getPlanByPriceId(user.stripePriceId || "");

  return {
    ...user,
    plan: activePlan,
    status: user.deletedAt ? "SUSPENDED" : "ACTIVE",
    auditLogs,
  };
}

/**
 * Change a user's role in local DB and Clerk public metadata.
 */
export async function changeUserRole(userId: string, role: UserRole) {
  const payload = RoleChangeSchema.parse({ userId, role });
  const admin = await requireAdmin();

  if (payload.userId === admin.id) {
    throw new Error("You cannot change your own administrative role.");
  }

  const targetUser = await db.user.findUnique({ where: { id: payload.userId } });
  if (!targetUser) {
    throw new Error("User not found.");
  }

  // Update in local DB
  const updatedUser = await db.user.update({
    where: { id: payload.userId },
    data: { role: payload.role },
  });

  // Sync with Clerk public metadata
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(targetUser.clerkId, {
      publicMetadata: {
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Failed to sync role change with Clerk metadata:", error);
  }

  // CRITICAL: Purge stale TTL authentications
  await invalidateCache(CACHE_KEYS.userProfile(targetUser.clerkId));

  // Log to AuditLog
  await writeAuditLog({
    userId: admin.id,
    action: `Changed user role for ${targetUser.email} to ${payload.role}`,
    targetType: "User",
    targetId: payload.userId,
    metadata: { role: payload.role, previousRole: targetUser.role },
  });

  revalidatePath(`/admin/users`);
  revalidatePath(`/admin/users/${payload.userId}`);
  return updatedUser;
}

/**
 * Suspend (soft-delete) or restore a user.
 */
export async function suspendUser(userId: string, suspend: boolean) {
  const payload = SuspendSchema.parse({ userId, suspend });
  const admin = await requireAdmin();

  if (payload.userId === admin.id) {
    throw new Error("You cannot suspend your own administrative account.");
  }

  const targetUser = await db.user.findUnique({ where: { id: payload.userId } });
  if (!targetUser) {
    throw new Error("User not found.");
  }

  const deletedAt = payload.suspend ? new Date() : null;

  // Update DB
  const _updatedUser = await db.user.update({
    where: { id: payload.userId },
    data: { deletedAt },
  });

  // Call Clerk users ban API
  try {
    const client = await clerkClient();
    if (payload.suspend) {
      await client.users.banUser(targetUser.clerkId);
    } else {
      await client.users.unbanUser(targetUser.clerkId);
    }
  } catch (error) {
    console.error(`Failed to Clerk ${payload.suspend ? "ban" : "unban"} user:`, error);
  }

  // CRITICAL: Purge stale TTL authentications
  await invalidateCache(CACHE_KEYS.userProfile(targetUser.clerkId));

  // Log action
  await writeAuditLog({
    userId: admin.id,
    action: payload.suspend ? `Suspended user ${targetUser.email}` : `Restored user ${targetUser.email}`,
    targetType: "User",
    targetId: payload.userId,
    metadata: { suspend: payload.suspend },
  });

  revalidatePath(`/admin/users`);
  return { success: true };
}

/**
 * Fetch all organizations with pagination, search, and plan filtering.
 */
export async function getAllOrganizations(params: {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
}) {
   
  const _admin = await requireAdmin();

  const page = params.page || 1;
  const limit = params.limit || 10;
  const search = params.search || "";
  const plan = params.plan || "ALL";

  const skip = (page - 1) * limit;

   
  const where: Prisma.OrganizationWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (plan !== "ALL") {
    where.plan = plan;
  }

  const [organizations, totalCount] = await Promise.all([
    db.organization.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          select: {
            id: true,
          },
        },
      },
    }),
    db.organization.count({ where }),
  ]);

  return {
    organizations: organizations.map((org) => ({
      ...org,
      membersCount: org.members.length,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Fetch highly detailed organization metrics, users, file size aggregates, AI costs, and flags.
 */
export async function getOrganizationDetails(orgId: string) {
   
  const _admin = await requireAdmin();

  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      },
      settings: true,
    },
  });

  if (!org) {
    throw new Error("Organization not found.");
  }

  // Calculate monthly AI usage and costs
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const aiLogsAggregate = await db.aiUsageLog.aggregate({
    where: {
      organizationId: orgId,
      createdAt: { gte: startOfMonth },
    },
    _sum: {
      totalTokens: true,
      cost: true,
    },
    _count: {
      id: true,
    },
  });

  // Calculate total file storage size
  const filesAggregate = await db.file.aggregate({
    where: { organizationId: orgId },
    _sum: {
      size: true,
    },
    _count: {
      id: true,
    },
  });

  const normalizeFeatures = (value: unknown): Record<string, boolean> | string | null => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, boolean>;
    }
    return null;
  };

  return {
    ...org,
    settings: org.settings
      ? { ...org.settings, features: normalizeFeatures(org.settings.features) }
      : null,
    members: org.members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
    aiUsageThisMonth: {
      totalTokens: aiLogsAggregate._sum.totalTokens || 0,
      cost: aiLogsAggregate._sum.cost || 0,
      requestsCount: aiLogsAggregate._count.id || 0,
    },
    storageUsedBytes: filesAggregate._sum.size || 0,
    filesCount: filesAggregate._count.id || 0,
  };
}

/**
 * Adjust organization membership roles or billing structure plans manually.
 */
export async function changeOrganizationPlan(orgId: string, plan: string) {
  const admin = await requireAdmin();

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new Error("Organization not found.");
  }

  const updatedOrg = await db.organization.update({
    where: { id: orgId },
    data: { plan },
  });

  // Write to audit log
  await writeAuditLog({
    userId: admin.id,
    action: `Changed organization ${org.name} plan to ${plan}`,
    targetType: "Organization",
    targetId: orgId,
    metadata: { previousPlan: org.plan, newPlan: plan },
  });

  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${orgId}`);
  return updatedOrg;
}

/**
 * Permanently delete organization workspace and cancel all connections.
 */
export async function deleteOrganization(orgId: string) {
  const admin = await requireAdmin();

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new Error("Organization not found.");
  }

  // Audit log
  await writeAuditLog({
    userId: admin.id,
    action: `Permanently deleted organization ${org.name}`,
    targetType: "Organization",
    targetId: orgId,
    metadata: { orgName: org.name, slug: org.slug },
  });

  await db.organization.delete({
    where: { id: orgId },
  });

  revalidatePath("/admin/organizations");
  return { success: true };
}

/**
 * Retrieve all active subscriptions mapping stripe customer sessions.
 */
export async function getAllSubscriptions(params: {
  page?: number;
  limit?: number;
  plan?: string;
  status?: string;
}) {
   
  const _admin = await requireAdmin();

  const page = params.page || 1;
  const limit = params.limit || 10;
  const plan = params.plan || "ALL";
  const status = params.status || "ALL";

  const skip = (page - 1) * limit;

   
  const where: Prisma.UserWhereInput = {
    stripeSubscriptionId: { not: null },
  };

  if (plan !== "ALL") {
    if (plan === "PRO") {
      where.stripePriceId = {
        in: [
          PLANS.PRO.priceId,
          PLANS.PRO.priceIdAnnual,
          "price_1ProPlan_Placeholder",
          "price_1ProPlanAnnual_Placeholder",
        ],
      };
    } else if (plan === "ENTERPRISE") {
      where.stripePriceId = {
        in: [
          PLANS.ENTERPRISE.priceId,
          PLANS.ENTERPRISE.priceIdAnnual,
          "price_1EnterprisePlan_Placeholder",
          "price_1EnterprisePlanAnnual_Placeholder",
        ],
      };
    }
  }

  if (status !== "ALL") {
    where.subscriptionStatus = status as SubscriptionStatus;
  }

  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    }),
    db.user.count({ where }),
  ]);

  const subscriptions = users.map((user) => {
    const activePlan = getPlanByPriceId(user.stripePriceId || "");
    return {
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      plan: activePlan,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
    };
  });

  return {
    subscriptions,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Cancel user subscription immediately on Stripe and downgrade locally.
 */
export async function cancelSubscription(userId: string) {
  const admin = await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.stripeSubscriptionId) {
    throw new Error("Active subscription not found for this user.");
  }

  // Cancel immediately via Stripe
  try {
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);
  } catch (error) {
    console.error("Failed to cancel subscription on Stripe (might already be canceled):", error);
  }

  // Downgrade local profile
  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: SubscriptionStatus.CANCELED,
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  });

  // Notify user
  await db.notification.create({
    data: {
      userId,
      title: "Subscription Cancelled",
      message: "Your subscription has been cancelled immediately by a system administrator.",
      type: "WARNING",
    },
  });

  // Log action
  await writeAuditLog({
    userId: admin.id,
    action: `Cancelled premium subscription for ${user.email}`,
    targetType: "User",
    targetId: userId,
    metadata: { userEmail: user.email, previousStatus: user.subscriptionStatus },
  });

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/users/${userId}`);
  return updatedUser;
}

/**
 * Extend active subscription cycles by 30 days.
 */
export async function giveFreeMonth(userId: string) {
  const admin = await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.stripeSubscriptionId) {
    throw new Error("Active premium subscription not found for this user.");
  }

  const baseDate = user.currentPeriodEnd ? new Date(user.currentPeriodEnd) : new Date();
  const ExtendedPeriodEnd = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Synchronize update to Stripe billing server by extending the subscription trial period
  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      trial_end: Math.floor(ExtendedPeriodEnd.getTime() / 1000),
      proration_behavior: "none",
    });
   
  } catch (stripeErr: unknown) {
    console.error("Failed to sync trial_end extension to Stripe:", stripeErr);
    const stripeMessage = stripeErr instanceof Error ? stripeErr.message : "Unknown error";
    throw new Error(`Stripe synchronization failed: ${stripeMessage}`);
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      currentPeriodEnd: ExtendedPeriodEnd,
    },
  });

  // Dispatch success banner notification
  await db.notification.create({
    data: {
      userId,
      title: "Free Subscription Month Granted",
      message: "Awesome news! A system administrator has granted you an extra free month of premium features.",
      type: "SUCCESS",
    },
  });

  // Audit log
  await writeAuditLog({
    userId: admin.id,
    action: `Granted 30 free days to user ${user.email}`,
    targetType: "User",
    targetId: userId,
    metadata: {
      userEmail: user.email,
      previousPeriodEnd: user.currentPeriodEnd,
      newPeriodEnd: ExtendedPeriodEnd,
    },
  });

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/users/${userId}`);
  return updatedUser;
}

/**
 * Overrides active JSON feature arrays for an organization.
 */
export async function updateOrganizationFeatures(orgId: string, features: Record<string, boolean>) {
  const admin = await requireAdmin();

  const org = await db.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new Error("Organization not found.");
  }

  const updatedSettings = await db.organizationSettings.upsert({
    where: { organizationId: orgId },
    update: {
       
      features: features as Prisma.InputJsonValue,
    },
    create: {
      organizationId: orgId,
       
      features: features as Prisma.InputJsonValue,
    },
  });

  // Audit log
  await writeAuditLog({
    userId: admin.id,
    action: `Updated feature flags override for organization ${org.name}`,
    targetType: "Organization",
    targetId: orgId,
    metadata: { features },
  });

  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin/features");
  return updatedSettings;
}

/**
 * Create a new announcement alert.
 */
export async function createAnnouncement(data: {
  title: string;
  message: string;
  type: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  const admin = await requireAdmin();

  const announcement = await db.announcement.create({
    data: {
      title: data.title,
      message: data.message,
       
      type: data.type as AnnouncementType,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdById: admin.id,
    },
  });

  // Audit log
  await writeAuditLog({
    userId: admin.id,
    action: `Created new announcement alert: ${data.title}`,
    targetType: "Announcement",
    targetId: announcement.id,
    metadata: data,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return announcement;
}

/**
 * Toggle announcement active boolean instantly.
 */
export async function toggleAnnouncementActive(id: string, active: boolean) {
  const admin = await requireAdmin();

  const announcement = await db.announcement.update({
    where: { id },
    data: { active },
  });

  await writeAuditLog({
    userId: admin.id,
    action: `${active ? "Activated" : "Deactivated"} announcement alert: ${announcement.title}`,
    targetType: "Announcement",
    targetId: id,
    metadata: { active },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return announcement;
}

/**
 * Delete an announcement from DB.
 */
export async function deleteAnnouncement(id: string) {
  const admin = await requireAdmin();

  const announcement = await db.announcement.delete({
    where: { id },
  });

  await writeAuditLog({
    userId: admin.id,
    action: `Deleted announcement alert: ${announcement.title}`,
    targetType: "Announcement",
    targetId: id,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Get all content reports in moderation queue.
 */
export async function getAllReports(params: { page?: number; limit?: number }) {
   
  const _admin = await requireAdmin();

  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const [reports, totalCount] = await Promise.all([
    db.contentReport.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    db.contentReport.count(),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Clear moderation reports flag and reset BlogPost reportCount to 0.
 */
export async function dismissReports(postId: string) {
  const admin = await requireAdmin();

  const post = await db.blogPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Blog post not found.");
  }

  await db.contentReport.deleteMany({
    where: { postId },
  });

  await db.blogPost.update({
    where: { id: postId },
    data: { reportCount: 0 },
  });

  await writeAuditLog({
    userId: admin.id,
    action: `Dismissed content report flags for blog post: ${post.title}`,
    targetType: "BlogPost",
    targetId: postId,
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/blog");
  return { success: true };
}

/**
 * Remove reported content from blog permanently.
 */
export async function removeReportedContent(postId: string) {
  const admin = await requireAdmin();

  const post = await db.blogPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Blog post not found.");
  }

  await db.blogPost.delete({
    where: { id: postId },
  });

  await writeAuditLog({
    userId: admin.id,
    action: `Deleted reported blog post permanently: ${post.title}`,
    targetType: "BlogPost",
    targetId: postId,
    metadata: { title: post.title, authorId: post.authorId },
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/blog");
  return { success: true };
}

/**
 * Dispatches a warning message to the author.
 */
export async function warnAuthor(postId: string, warning: string) {
  const admin = await requireAdmin();

  const post = await db.blogPost.findUnique({
    where: { id: postId },
    include: {
      author: true,
    },
  });

  if (!post) {
    throw new Error("Blog post not found.");
  }

  // Generate in-app warning notification
  await db.notification.create({
    data: {
      userId: post.authorId,
      title: "Content Moderation Warning",
      message: `Your blog post "${post.title}" was reported. Warning: ${warning}`,
      type: "WARNING",
    },
  });

  // Generate mock EmailLog for author warn email dispatching
  await db.emailLog.create({
    data: {
      to: post.author.email,
      subject: "Content Moderation Action Required",
      template: "moderation-warning",
      status: "SENT",
    },
  });

  // Audit log
  await writeAuditLog({
    userId: admin.id,
    action: `Sent warning notice to author of post: ${post.title}`,
    targetType: "User",
    targetId: post.authorId,
    metadata: { warningMessage: warning, postId },
  });

  revalidatePath("/admin/moderation");
  return { success: true };
}


/**
 * Delete a user permanently from DB and Clerk.
 */
export async function deleteUser(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    throw new Error("You cannot delete your own administrative account.");
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    throw new Error("User not found.");
  }

  // Delete from Clerk
  try {
    const client = await clerkClient();
    await client.users.deleteUser(targetUser.clerkId);
  } catch (error) {
    console.error("Failed to delete user from Clerk:", error);
  }

  // Delete from DB
  await db.user.delete({
    where: { id: userId },
  });

  // Log action
  await writeAuditLog({
    userId: admin.id,
    action: `Permanently deleted user ${targetUser.email}`,
    targetType: "User",
    targetId: userId,
    metadata: { deletedEmail: targetUser.email, deletedClerkId: targetUser.clerkId },
  });

  revalidatePath(`/admin/users`);
  return { success: true };
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get system audit logs with pagination, search, and type-based filters.
 */
export async function getAuditLogs(params: GetAuditLogsParams) {
   
  const _admin = await requireAdmin();

  const page = params.page || 1;
  const limit = params.limit || 10;
  const search = params.search || "";
  const userIdFilter = params.userId || "ALL";
  const targetTypeFilter = params.targetType || "ALL";
  const startDateStr = params.startDate || "";
  const endDateStr = params.endDate || "";

  const skip = (page - 1) * limit;

   
  const where: Prisma.AuditLogWhereInput = {};

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { targetId: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { userId: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        }
      }
    ];
  }

  if (userIdFilter !== "ALL") {
    where.userId = userIdFilter;
  }

  if (targetTypeFilter !== "ALL") {
    where.targetType = targetTypeFilter;
  }

  if (startDateStr || endDateStr) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (startDateStr) {
      createdAt.gte = new Date(startDateStr);
    }
    if (endDateStr) {
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    }
  };
}
