"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  ForbiddenError,
  ConflictError,
  NotFoundError,
  ValidationError,
  BadRequestError,
} from "@/lib/errors";
import { MembershipRole, Prisma } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import { createNotification, createBulkNotifications } from "@/lib/notifications";

import { sendTransactionalEmail } from "@/lib/resend";
import { InviteEmail } from "@/emails/InviteEmail";
import { publishToOrg } from "@/lib/realtime";
import { triggerWebhook } from "@/lib/webhooks";
import { captureEvent } from "@/lib/posthog";
import { ANALYTICS_EVENTS } from "@/lib/constants";

// Validation schemas
const InviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(MembershipRole),
  orgId: z.string().uuid("Invalid organization ID"),
});

const RemoveMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  orgId: z.string().uuid("Invalid organization ID"),
});

const ChangeRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  orgId: z.string().uuid("Invalid organization ID"),
  role: z.nativeEnum(MembershipRole),
});

const UpdateOrgSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  logo: z.string().url("Logo must be a valid URL").or(z.literal("")).nullable(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
});


/**
 * Invites a new member to the organization.
 */
export async function inviteMember(email: string, role: MembershipRole, orgId: string) {
  const user = await requireAuth();
  InviteSchema.parse({ email, role, orgId });

  // 1. Verify user's own role in organization
  const selfMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (!selfMembership || (selfMembership.role !== "OWNER" && selfMembership.role !== "ADMIN")) {
    throw new ForbiddenError("Only organization Owners and Admins can invite new members.");
  }

  // 2. Check if the email is already a member
  const targetUser = await db.user.findUnique({ where: { email } });
  if (targetUser) {
    const existingMember = await db.membership.findUnique({
      where: { userId_organizationId: { userId: targetUser.id, organizationId: orgId } },
    });
    if (existingMember) {
      throw new ConflictError("User is already a member of this organization.");
    }
  }

  // 3. Check for active pending invitation
  const existingInvite = await db.invitation.findFirst({
    where: {
      organizationId: orgId,
      email,
      acceptedAt: null,
      expiresAt: { gte: new Date() },
    },
  });

  if (existingInvite) {
    throw new ConflictError("An active pending invitation already exists for this email.");
  }

  // 4. Verify organization member limits
  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new NotFoundError("Organization not found.");
  }

  const currentMemberCount = await db.membership.count({ where: { organizationId: orgId } });
  const pendingInviteCount = await db.invitation.count({
    where: { organizationId: orgId, acceptedAt: null, expiresAt: { gte: new Date() } },
  });

  if (currentMemberCount + pendingInviteCount >= org.maxMembers) {
    throw new ValidationError(`Your organization plan limits members/invites to a maximum of ${org.maxMembers}. Please upgrade.`);
  }

  // 5. Generate secure token & expiry date
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await db.invitation.create({
    data: {
      email,
      role,
      token,
      expiresAt,
      organizationId: orgId,
      invitedById: user.id,
    },
  });

  // 6. Send invitation email via Resend
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;
  
  try {
    await sendTransactionalEmail(
      email,
      `Invitation to join ${org.name} on Antigravity`,
      InviteEmail,
      {
        inviterName: user.name || user.email,
        organizationName: org.name,
        inviteLink,
      }
    );
  } catch (error) {
    console.error("Failed to send invite email", error);
  }

  // Create notifications and audit log
  if (targetUser) {
    await createNotification({
      userId: targetUser.id,
      title: "Workspace Invitation",
      message: `You have been invited to join the workspace "${org.name}" as an ${role.toLowerCase()}.`,
      type: "info",
      link: `/invite/${token}`,
      category: "invite",
    });
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Invited Member (${email}) as ${role}`,
      targetType: "Invitation",
      targetId: invitation.id,
    },
  });

  await triggerWebhook(orgId, 'team.member_invited', {
    email,
    role,
    inviterId: user.id,
  });

  captureEvent(user.id, ANALYTICS_EVENTS.MEMBER_INVITED, {
    role,
  });

  revalidatePath("/dashboard/team");
  return invitation;
}

/**
 * Resends a pending invitation.
 */
export async function resendInvitation(inviteId: string) {
  const user = await requireAuth();

  const invitation = await db.invitation.findUnique({
    where: { id: inviteId },
    include: { organization: true },
  });

  if (!invitation) {
    throw new NotFoundError("Invitation not found.");
  }

  const selfMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: invitation.organizationId } },
  });

  if (!selfMembership || (selfMembership.role !== "OWNER" && selfMembership.role !== "ADMIN")) {
    throw new ForbiddenError("Only organization Owners and Admins can resend invites.");
  }

  // Generate new token & extend expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const updatedInvitation = await db.invitation.update({
    where: { id: inviteId },
    data: { token, expiresAt },
  });

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;
  
  try {
    await sendTransactionalEmail(
      invitation.email,
      `Reminder: Invitation to join ${invitation.organization.name} on Antigravity`,
      InviteEmail,
      {
        inviterName: user.name || user.email,
        organizationName: invitation.organization.name,
        inviteLink,
      }
    );
  } catch (error) {
    console.error("Failed to resend invite email", error);
  }

  revalidatePath("/dashboard/team");
  return updatedInvitation;
}

/**
 * Cancels a pending invitation.
 */
export async function cancelInvitation(inviteId: string) {
  const user = await requireAuth();

  const invitation = await db.invitation.findUnique({
    where: { id: inviteId },
  });

  if (!invitation) {
    throw new NotFoundError("Invitation not found.");
  }

  const selfMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: invitation.organizationId } },
  });

  if (!selfMembership || (selfMembership.role !== "OWNER" && selfMembership.role !== "ADMIN")) {
    throw new ForbiddenError("Only organization Owners and Admins can cancel invitations.");
  }

  await db.invitation.delete({ where: { id: inviteId } });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Cancelled Invitation for ${invitation.email}`,
      targetType: "Invitation",
      targetId: inviteId,
    },
  });

  revalidatePath("/dashboard/team");
  return { success: true };
}

/**
 * Removes a member from the organization.
 */
export async function removeMember(userId: string, orgId: string) {
  const user = await requireAuth();
  RemoveMemberSchema.parse({ userId, orgId });

  // 1. Verify user's own role
  const selfMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (!selfMembership || (selfMembership.role !== "OWNER" && selfMembership.role !== "ADMIN")) {
    throw new ForbiddenError("Only organization Owners and Admins can remove members.");
  }

  // 2. Fetch target member details
  const targetMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    include: { user: true },
  });

  if (!targetMembership) {
    throw new NotFoundError("Member not found in this organization.");
  }

  // 3. Safety checks
  if (targetMembership.role === "OWNER") {
    throw new ValidationError("The organization Owner cannot be removed.");
  }

  if (selfMembership.role === "ADMIN" && targetMembership.role === "ADMIN") {
    throw new ForbiddenError("Admins cannot remove other Admins.");
  }

  await db.membership.delete({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  await publishToOrg(orgId, 'team_activity', { action: 'remove', userId, email: targetMembership.user.email });

  // Create notifications and audit log
  await createNotification({
    userId,
    title: "Membership Removed",
    message: `You have been removed from the organization workspace.`,
    type: "warning",
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Removed Member: ${targetMembership.user.email}`,
      targetType: "Membership",
      targetId: targetMembership.id,
    },
  });

  revalidatePath("/dashboard/team");
  return { success: true };
}

/**
 * Changes a member's role.
 */
export async function changeMemberRole(userId: string, orgId: string, role: MembershipRole) {
  const user = await requireAuth();
  ChangeRoleSchema.parse({ userId, orgId, role });

  // 1. Verify caller has OWNER privileges
  const selfMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (!selfMembership || selfMembership.role !== "OWNER") {
    throw new ForbiddenError("Only the organization Owner can change roles.");
  }

  // 2. Fetch target details
  const targetMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    include: { user: true },
  });

  if (!targetMembership) {
    throw new NotFoundError("Member not found.");
  }

  if (targetMembership.userId === user.id) {
    throw new ValidationError("You cannot change your own Owner role.");
  }

  const updated = await db.membership.update({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    data: { role },
  });

  await publishToOrg(orgId, 'team_activity', { action: 'role_update', userId, role });

  // Notifications
  await createNotification({
    userId,
    title: "Role Updated",
    message: `Your role has been changed to ${role} in the organization.`,
    type: "info",
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Changed Member Role (${targetMembership.user.email}) to ${role}`,
      targetType: "Membership",
      targetId: targetMembership.id,
    },
  });

  revalidatePath("/dashboard/team");
  return updated;
}

/**
 * Accepts a pending invitation.
 */
export async function acceptInvitation(token: string) {
  const user = await requireAuth();

  // Find invitation
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation) {
    throw new BadRequestError("Invalid invitation token.");
  }

  if (invitation.acceptedAt) {
    throw new ConflictError("This invitation has already been accepted.");
  }

  if (invitation.expiresAt < new Date()) {
    throw new BadRequestError("This invitation has expired.");
  }

  // Check if already member
  const existingMember = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: invitation.organizationId } },
  });

  if (existingMember) {
    // Already in, just mark accepted
    await db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return invitation.organizationId;
  }

  // Verify limit
  const currentCount = await db.membership.count({ where: { organizationId: invitation.organizationId } });
  if (currentCount >= invitation.organization.maxMembers) {
    throw new ValidationError("The organization has reached its maximum member limit. Contact the owner.");
  }

  // Execute accept inside transaction
  await db.$transaction([
    db.membership.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await publishToOrg(invitation.organizationId, 'team_activity', { action: 'join', userId: user.id, name: user.name || user.email });

  // Notify inviter
  await createNotification({
    userId: invitation.invitedById,
    title: "Invitation Accepted",
    message: `${user.name || user.email} joined your organization.`,
    type: "success",
    link: "/team",
    category: "members",
  });

  // Notify other organization members
  const otherMemberships = await db.membership.findMany({
    where: {
      organizationId: invitation.organizationId,
      userId: { not: user.id },
    },
    select: { userId: true },
  });

  const memberIds = otherMemberships.map((m) => m.userId);
  if (memberIds.length > 0) {
    await createBulkNotifications(memberIds, {
      title: "New Team Member Joined",
      message: `${user.name || user.email} has accepted their invitation and joined ${invitation.organization.name}.`,
      type: "success",
      link: "/team",
      category: "members",
    });
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Joined Organization: ${invitation.organization.name}`,
      targetType: "Organization",
      targetId: invitation.organizationId,
    },
  });

  await triggerWebhook(invitation.organizationId, 'team.member_joined', {
    userId: user.id,
    email: user.email,
    role: invitation.role,
  });

  return invitation.organizationId;
}

/**
 * Creates a brand new organization workspace.
 */
export async function createOrganizationAction(name: string) {
  const user = await requireAuth();
  if (!name || name.trim().length < 2) {
    throw new ValidationError("Name must be at least 2 characters long.");
  }

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug || "workspace"}-${crypto.randomBytes(3).toString("hex")}`;

  const org = await db.organization.create({
    data: {
      name,
      slug,
      plan: "FREE",
      maxMembers: 5,
      maxAiCredits: 100,
      usedAiCredits: 0,
    },
  });

  // Owner membership
  await db.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Created Organization Workspace: ${name}`,
      targetType: "Organization",
      targetId: org.id,
    },
  });

  revalidatePath("/dashboard");
  return org;
}

/**
 * Updates organization settings details.
 */
export async function updateOrganizationAction(
  orgId: string,
  name: string,
  logo: string | null,
  slug: string
) {
  const user = await requireAuth();
  UpdateOrgSchema.parse({ orgId, name, logo, slug });

  // 1. Verify calling user role
  const selfMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (!selfMembership || (selfMembership.role !== "OWNER" && selfMembership.role !== "ADMIN")) {
    throw new ForbiddenError("Only organization Owners and Admins can update settings.");
  }

  // 2. Verify slug uniqueness
  const existingOrg = await db.organization.findFirst({
    where: {
      slug,
      id: { not: orgId },
    },
  });

  if (existingOrg) {
    throw new ConflictError("This slug is already taken by another organization.");
  }

  const updated = await db.organization.update({
    where: { id: orgId },
    data: { name, logo, slug },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Updated Organization Settings for ${name}`,
      targetType: "Organization",
      targetId: orgId,
    },
  });

  revalidatePath("/settings/organization");
  revalidatePath("/dashboard");
  return updated;
}

/**
 * Deletes organization workspace.
 */
export async function deleteOrganizationAction(orgId: string) {
  const user = await requireAuth();

  // Verify OWNER
  const selfMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (!selfMembership || selfMembership.role !== "OWNER") {
    throw new ForbiddenError("Only the organization Owner can delete the workspace.");
  }

  const org = await db.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new NotFoundError("Organization not found.");
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Deleted Organization Workspace: ${org.name}`,
      targetType: "Organization",
      targetId: orgId,
      metadata: { orgName: org.name, slug: org.slug } as Prisma.InputJsonValue,
    },
  });

  await db.organization.delete({
    where: { id: orgId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
