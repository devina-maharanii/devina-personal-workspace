"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

/**
 * Dismisses the onboarding checklist by marking the organization onboarding state as complete.
 */
export async function completeOnboardingAction(orgId: string) {
  const user = await requireAuth();

  // Validate user membership to prevent unauthorized settings edits
  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: orgId,
    },
  });

  if (!membership) {
    throw new Error("Unauthorized membership access.");
  }

  const updatedOrg = await db.organization.update({
    where: { id: orgId },
    data: { onboardingCompleted: true },
  });

  // Log the action
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "Completed Onboarding Checklist",
      targetType: "Organization",
      targetId: orgId,
      metadata: { dismissedByUser: user.email },
    },
  });

  revalidatePath("/dashboard");
  return updatedOrg;
}

/**
 * Registers an event in the AuditLog database.
 */
export async function logDashboardActivityAction(
  action: string,
  targetType: string,
  targetId?: string,
   
  metadata?: unknown
) {
  const user = await requireAuth();

  const log = await db.auditLog.create({
    data: {
      userId: user.id,
      action,
      targetType,
      targetId: targetId || null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });

  revalidatePath("/dashboard");
  return log;
}
