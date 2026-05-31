import { db } from "@/lib/db";
import crypto from "crypto";

const WEBHOOK_TIMEOUT_MS = 10000;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

 
export async function triggerWebhook(orgId: string, event: string, payload: unknown) {
  // Find active webhook endpoints subscribed to this event
  const endpoints = await db.webhookEndpoint.findMany({
    where: {
      orgId,
      active: true,
      events: { has: event },
    },
  });

  if (endpoints.length === 0) return;

  const serializedPayload = JSON.stringify({
    event,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  const parsedPayload = JSON.parse(serializedPayload);

  // Record delivery attempts as PENDING in a single transaction batch
  const deliveries = await db.$transaction(
    endpoints.map((endpoint) =>
      db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: parsedPayload,
          status: "PENDING",
          attempts: 1,
        },
      })
    )
  );

  await Promise.all(
    endpoints.map(async (endpoint, index) => {
      const delivery = deliveries[index];
      
      // Calculate HMAC-SHA256 signature
      const signature = crypto
        .createHmac("sha256", endpoint.secret)
        .update(serializedPayload)
        .digest("hex");

      // Attempt delivery
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

        const res = await fetch(endpoint.url, {
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
          where: { id: delivery.id },
          data: {
            status: res.ok ? "SUCCESS" : "FAILED",
            response: {
              status: res.status,
              body: responseBody.slice(0, 1000), // store up to 1000 chars
            },
          },
        });
       
      } catch (error: unknown) {
        await db.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            response: {
              error: getErrorMessage(error, "Network error or timeout"),
            },
          },
        });
      }
    })
  );
}

export async function retryFailedWebhooks() {
  // Find FAILED deliveries with < 3 attempts
  const failedDeliveries = await db.webhookDelivery.findMany({
    where: {
      status: "FAILED",
      attempts: { lt: 3 },
    },
    include: {
      endpoint: true,
    },
  });

  for (const delivery of failedDeliveries) {
    if (!delivery.endpoint.active) continue;

    // Exponential backoff logic
    // Retry 1: 2^1 = 2 mins
    // Retry 2: 2^2 = 4 mins
    const delayMinutes = Math.pow(2, delivery.attempts);
    const retryThreshold = new Date(delivery.createdAt.getTime() + delayMinutes * 60 * 1000);

    if (new Date() < retryThreshold) {
      // Too soon to retry
      continue;
    }

    const serializedPayload = JSON.stringify(delivery.payload);
    const signature = crypto
      .createHmac("sha256", delivery.endpoint.secret)
      .update(serializedPayload)
      .digest("hex");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

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
        where: { id: delivery.id },
        data: {
          status: res.ok ? "SUCCESS" : "FAILED",
          attempts: { increment: 1 },
          response: {
            status: res.status,
            body: responseBody.slice(0, 1000),
          },
        },
      });
     
    } catch (error: unknown) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          response: {
            error: getErrorMessage(error, "Network error or timeout"),
          },
        },
      });
    }
  }
}
