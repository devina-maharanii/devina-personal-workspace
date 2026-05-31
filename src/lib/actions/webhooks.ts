"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, getActiveOrg, getOrganizationMembership } from "@/lib/auth";
import crypto from "crypto";
import { triggerWebhook } from "@/lib/webhooks";

/** Ensures the current user is at least an OWNER or ADMIN of the active org. */
async function requireOrgAdmin() {
  const user = await requireAuth();
  const org = await getActiveOrg(user.id);
  const membership = await getOrganizationMembership(org.id);
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new Error("Forbidden: org admin access required");
  }
  return { user, org };
}

export async function createWebhookEndpoint(url: string, events: string[]) {
  const { org } = await requireOrgAdmin();

  const secret = "whsec_" + crypto.randomBytes(32).toString("hex");

  await db.webhookEndpoint.create({
    data: {
      orgId: org.id,
      url,
      secret,
      events,
    },
  });

  revalidatePath("/settings/webhooks");
}

export async function toggleWebhook(id: string, active: boolean) {
  const { org } = await requireOrgAdmin();

  const endpoint = await db.webhookEndpoint.findUnique({
    where: { id },
  });

  if (!endpoint || endpoint.orgId !== org.id) throw new Error("Not found");

  await db.webhookEndpoint.update({
    where: { id },
    data: { active },
  });

  revalidatePath("/settings/webhooks");
}

export async function deleteWebhook(id: string) {
  const { org } = await requireOrgAdmin();

  const endpoint = await db.webhookEndpoint.findUnique({
    where: { id },
  });

  if (!endpoint || endpoint.orgId !== org.id) throw new Error("Not found");

  await db.webhookEndpoint.delete({
    where: { id },
  });

  revalidatePath("/settings/webhooks");
}

export async function testWebhook(id: string) {
  const { org } = await requireOrgAdmin();

  const endpoint = await db.webhookEndpoint.findUnique({
    where: { id },
  });

  if (!endpoint || endpoint.orgId !== org.id) throw new Error("Not found");

  // Send a test payload
  await triggerWebhook(org.id, "ping", { message: "Test webhook successful" });

  revalidatePath("/settings/webhooks");
}

export async function redeliverWebhook(deliveryId: string) {
  const { org } = await requireOrgAdmin();

  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });

  if (!delivery || delivery.endpoint.orgId !== org.id) throw new Error("Not found");

  const serializedPayload = JSON.stringify(delivery.payload);
  const signature = crypto
    .createHmac("sha256", delivery.endpoint.secret)
    .update(serializedPayload)
    .digest("hex");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(delivery.endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body: serializedPayload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseBody = await res.text().catch(() => "Unable to read response body");

    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: res.ok ? "SUCCESS" : "FAILED",
        response: {
          status: res.status,
          body: responseBody.slice(0, 1000),
        },
      },
    });
   
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network error";
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        response: {
          error: message,
        },
      },
    });
  }

  revalidatePath(`/settings/webhooks/${delivery.endpointId}`);
}
