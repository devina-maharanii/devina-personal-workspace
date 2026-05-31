import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getCurrentUser, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createNotification } from "@/lib/notifications";
import { sendTransactionalEmail } from "@/lib/resend";
import { LowCreditsEmail } from "@/emails/LowCreditsEmail";
 
import { triggerWebhook } from "@/lib/webhooks";
import { captureEvent } from "@/lib/posthog";
import { ANALYTICS_EVENTS } from "@/lib/constants";
import { withRateLimit, aiLimiter, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max execution time for streaming responses

type ChatStreamMessages = Parameters<typeof streamText>[0]["messages"];

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type OwnerRecord = {
  userId: string;
  user: { email: string | null; name: string | null };
};

const isIncomingMessage = (value: unknown): value is IncomingMessage => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string"
  );
};

async function handler(req: Request) {
  try {
    // 1. Authenticate user session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve organization scope
    const org = await getActiveOrg(user.id);

    // 3. Enforce AI credit limit check
    if (org.usedAiCredits >= org.maxAiCredits) {
      captureEvent(user.id, ANALYTICS_EVENTS.AI_CREDITS_EXHAUSTED);
      return NextResponse.json({ error: "CREDITS_EXHAUSTED" }, { status: 402 });
    }

    // 4. Parse incoming body parameters
    const body = await req.json().catch(() => null);
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const model = typeof body?.model === "string" ? body.model : "";
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
    const fileUrl = typeof body?.fileUrl === "string" ? body.fileUrl : "";

    if (messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages content structure." }, { status: 400 });
    }
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required." }, { status: 400 });
    }

    const incomingMessages = messages.filter(isIncomingMessage);
    if (incomingMessages.length !== messages.length) {
      return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
    }

    // Enforce conversation ownership/tenant scope
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, userId: user.id, organizationId: org.id },
      select: { id: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // SSRF guard: only allow trusted UploadThing-hosted assets
    let fileImageUrl: URL | null = null;
    if (fileUrl) {
      try {
        const u = new URL(fileUrl);
        const isDev = process.env.NODE_ENV !== "production";
        const isAllowedProtocol = u.protocol === "https:" || (isDev && u.protocol === "http:");
        const allowedHosts = new Set(["utfs.io", "uploadthing.com", "www.uploadthing.com"]);
        if (isDev) allowedHosts.add("localhost:3000");

        if (!isAllowedProtocol || !allowedHosts.has(u.host)) {
          return NextResponse.json({ error: "Invalid fileUrl" }, { status: 400 });
        }

        fileImageUrl = u;
      } catch {
        return NextResponse.json({ error: "Invalid fileUrl" }, { status: 400 });
      }
    }

    // Map user models to Anthropic SDK formats
    let anthropicModel = "claude-3-5-sonnet-20241022";
    if (model.includes("opus")) {
      anthropicModel = "claude-3-opus-20240229";
    } else if (model.includes("haiku")) {
      anthropicModel = "claude-3-5-haiku-20241022";
    }

    // 5. Structure payload including potential UploadThing image vision attachments
     
    const formattedMessages: NonNullable<ChatStreamMessages> = incomingMessages.map(
      (m: IncomingMessage, idx: number) => {
        const isLast = idx === incomingMessages.length - 1;
        if (isLast && fileImageUrl) {
          return {
            role: "user",
            content: [{ type: "text", text: m.content }, { type: "image", image: fileImageUrl }],
          };
        }
        return {
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        };
      }
    );

    // 6. Spawn Streaming LLM Process using Vercel AI SDK
    const result = await streamText({
      model: anthropic(anthropicModel),
      messages: formattedMessages,
      system: `You are a helpful AI assistant operating inside a premium SaaS platform named Antigravity. Write highly-formatted, extremely clear markdown responses. Current Org: ${org.name}. User: ${user.name || user.email}.`,
      onFinish: (event) => {
        const { text, usage } = event;
        const promptTokens = usage?.inputTokens || 0;
        const completionTokens = usage?.outputTokens || 0;
        const totalCreditsUsed = usage?.totalTokens || (promptTokens + completionTokens);
        
        waitUntil((async () => {
          // Phase 1: Update org credits (critical path)
          const currentOrg = await db.organization.findUnique({
            where: { id: org.id },
            select: { usedAiCredits: true, maxAiCredits: true, name: true }
          });

          if (!currentOrg || currentOrg.usedAiCredits >= currentOrg.maxAiCredits) {
            console.error("Org credit limits fully exhausted in streaming transaction.");
            return;
          }

          const newCreditsTotal = Math.min(
            currentOrg.maxAiCredits,
            currentOrg.usedAiCredits + Math.ceil(totalCreditsUsed / 100)
          );

          await db.organization.update({
            where: { id: org.id },
            data: { usedAiCredits: newCreditsTotal }
          });

          const milestone80 = Math.floor(currentOrg.maxAiCredits * 0.8);
          let crossedMilestone = false;
           
          let owners: OwnerRecord[] = [];
          
          if (currentOrg.usedAiCredits < milestone80 && newCreditsTotal >= milestone80) {
            crossedMilestone = true;
            owners = await db.membership.findMany({
              where: { organizationId: org.id, role: "OWNER" },
              include: { user: true }
            });
          }

          // Phase 2: Async parallel DB writes
          const totalMsgs = await db.message.count({ where: { conversationId } });
          const dbTasks = [];

          dbTasks.push(
            db.message.create({
              data: {
                conversationId,
                role: "assistant",
                content: text,
              }
            })
          );

          dbTasks.push(
            db.aiUsageLog.create({
              data: {
                userId: user.id,
                organizationId: org.id,
                model: anthropicModel,
                promptTokens,
                completionTokens,
                totalTokens: totalCreditsUsed,
                cost: (promptTokens * 3 + completionTokens * 15) / 1000000,
                feature: "chat",
              }
            })
          );

          if (totalMsgs <= 2) {
            const lastUserMsg = incomingMessages[incomingMessages.length - 1]?.content || "New Session";
            const updatedTitle = lastUserMsg.slice(0, 45) + (lastUserMsg.length > 45 ? "..." : "");
            dbTasks.push(
              db.conversation.updateMany({
                where: { id: conversationId, userId: user.id, organizationId: org.id },
                data: { title: updatedTitle || "AI Session", updatedAt: new Date() },
              })
            );
          } else {
            dbTasks.push(
              db.conversation.updateMany({
                where: { id: conversationId, userId: user.id, organizationId: org.id },
                data: { updatedAt: new Date() },
              })
            );
          }

          await Promise.all(dbTasks);

          // Phase 3: Notifications and Webhooks
           
          const backgroundTasks: Promise<unknown>[] = [];

          if (crossedMilestone) {
            for (const member of owners) {
              backgroundTasks.push(
                createNotification({
                  userId: member.userId,
                  title: "Warning: AI Credits Exceeding 80%",
                  message: `Your organization "${currentOrg.name}" has consumed 80% of its monthly AI credits quota. Upgrade to active Pro tier.`,
                  type: "warning",
                  link: "/dashboard/settings/billing",
                  category: "billing"
                }).catch(err => console.error("milestone notifications failed:", err))
              );

              if (member.user.email) {
                backgroundTasks.push(
                  sendTransactionalEmail(
                    member.user.email,
                    `AI Credits Warning - 80% Exhausted`,
                    LowCreditsEmail,
                    {
                      name: member.user.name || "there",
                      orgName: currentOrg.name,
                      remainingCredits: currentOrg.maxAiCredits - newCreditsTotal,
                      totalCredits: currentOrg.maxAiCredits,
                      pricingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings/billing`
                    }
                  ).catch(err => console.error("milestone emails failed:", err))
                );
              }
            }
          }

          backgroundTasks.push(
            triggerWebhook(org.id, "ai.credits_used", {
              userId: user.id,
              creditsUsed: Math.ceil(totalCreditsUsed / 100),
              totalOrgCreditsUsed: newCreditsTotal
            }).catch(err => console.error("trigger webhook failed:", err))
          );

          backgroundTasks.push(
            Promise.resolve().then(() => captureEvent(user.id, ANALYTICS_EVENTS.AI_CREDITS_CONSUMED, {
              credits: Math.ceil(totalCreditsUsed / 100),
            })).catch(err => console.error("capture event failed:", err))
          );

          await Promise.allSettled(backgroundTasks);
        })());
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal streaming error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export const POST = withRateLimit(
  aiLimiter,
  async () => {
    const user = await getCurrentUser();
    return user ? `api-ai-chat-${user.id}` : `api-ai-chat-anon-${await getClientIp()}`;
  },
  handler
);
