"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const CreateOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  logoUrl: z.string().url().or(z.literal("")).nullable().optional(),
  industry: z.string().min(1, "Please select an industry"),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
  * Quick check to see if a workspace slug is unique and available.
  */
export async function checkSlugAvailability(slug: string) {
  try {
    const trimmed = slug.trim().toLowerCase();
    if (trimmed.length < 3) {
      return { available: false, reason: "Slug must be at least 3 characters" };
    }
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      return { available: false, reason: "Slug must only contain lowercase letters, numbers, and hyphens" };
    }

    const count = await db.organization.count({
      where: { slug: trimmed },
    });

    return { available: count === 0 };
   
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to check slug availability";
    return { available: false, error: message };
  }
}

/**
  * Instantiates organization and hooks owner membership, settings, and logs.
  */
export async function createOrganization(data: {
  name: string;
  slug: string;
  logoUrl?: string | null;
  industry: string;
}) {
  const user = await requireAuth();
  const validated = CreateOrgSchema.parse(data);

  // 1. Double check slug availability
  const isAvailable = await checkSlugAvailability(validated.slug);
  if (!isAvailable.available) {
    throw new Error(isAvailable.reason || "Slug is already taken by another organization.");
  }

  // 2. Create organization with default settings and OWNER membership in a transaction
  const org = await db.$transaction(async (tx) => {
    const newOrg = await tx.organization.create({
      data: {
        name: validated.name,
        slug: validated.slug.toLowerCase(),
        logo: validated.logoUrl || null,
        plan: "FREE",
        maxMembers: 5,
        maxAiCredits: 100,
        usedAiCredits: 0,
        onboardingStep: 1, // Progressing to Plan step
        onboardingCompleted: false,
      },
    });

    // Create owner membership
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: newOrg.id,
        role: "OWNER",
      },
    });

    // Create default organization settings
    await tx.organizationSettings.create({
      data: {
        organizationId: newOrg.id,
        brandColor: "#6366f1", // Indigo
        features: {
          industry: validated.industry,
          checklist: {
            workspaceCreated: true,
            planSelected: false,
            teamInvited: false,
            dashboardExplored: false,
          },
        },
        emailNotifications: true,
        emailNotificationTypes: ["invite", "billing", "credits", "members"],
        notificationDigestFreq: "immediate",
      },
    });

    return newOrg;
  });

  // 3. Create Audit Log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Completed Onboarding Step 1: Created Workspace "${org.name}"`,
      targetType: "Organization",
      targetId: org.id,
    },
  });

  revalidatePath("/dashboard");
  return org;
}

/**
  * Persists onboarding step level.
  */
export async function updateOnboardingStep(orgId: string, step: number) {
  const user = await requireAuth();

  // Validate owner / admin membership
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new Error("Only organization Owners and Admins can update onboarding states.");
  }

  const isCompleted = step >= 4;

  const org = await db.organization.update({
    where: { id: orgId },
    data: {
      onboardingStep: step,
      onboardingCompleted: isCompleted,
    },
  });

  // If completed, check off the onboarding items inside checklist settings
  if (isCompleted) {
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (settings) {
       
      const features = isRecord(settings.features) ? settings.features : {};
      const checklist = isRecord(features.checklist) ? features.checklist : {};
      
      await db.organizationSettings.update({
        where: { organizationId: orgId },
        data: {
          features: {
            ...features,
            checklist: {
              ...checklist,
              workspaceCreated: true,
              planSelected: true,
              teamInvited: true,
              dashboardExplored: true,
            },
          } as Prisma.InputJsonValue,
        },
      });
    }
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: isCompleted
        ? `Finished Organization Onboarding Wizard`
        : `Updated Onboarding State to Step ${step}`,
      targetType: "Organization",
      targetId: orgId,
    },
  });

  revalidatePath("/dashboard");
  return org;
}

/**
  * Checks off a specific onboarding/setup item in the checklist.
  */
export async function completeOnboardingItem(orgId: string, item: string) {
  const user = await requireAuth();

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });

  if (!membership) {
    throw new Error("Unauthorized");
  }

  const settings = await db.organizationSettings.findUnique({
    where: { organizationId: orgId },
  });

  if (!settings) {
    throw new Error("Settings not found");
  }

   
  const features = isRecord(settings.features) ? settings.features : {};
  const checklist = isRecord(features.checklist) ? features.checklist : {};

  const updatedSettings = await db.organizationSettings.update({
    where: { organizationId: orgId },
    data: {
      features: {
        ...features,
        checklist: {
          ...checklist,
          [item]: true,
        },
      } as Prisma.InputJsonValue,
    },
  });

  return updatedSettings;
}
