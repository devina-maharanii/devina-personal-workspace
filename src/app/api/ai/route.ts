import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { withRateLimit, aiLimiter, getClientIp } from "@/lib/rateLimit";
import { AIService } from "@/lib/ai";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const maxDuration = 60; // 60 seconds max execution time for AI completions

const AiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required."),
  systemInstruction: z.string().optional(),
});

async function handler(req: Request) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse input request
    const body = await req.json().catch(() => null);
    const parsed = AiRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid prompt parameter" }, { status: 400 });
    }

    const { prompt, systemInstruction } = parsed.data;

    // 3. Invoke AI Generation Service
    logger.info({ userId: user.id }, "Triggering AI generation");
    const textResult = await AIService.generateText({
      prompt,
      systemInstruction,
    });

    // 4. Create Audit Log in database asynchronously (with client IP address fetched dynamically)
    try {
      const headersList = req.headers;
      const xForwardedFor = headersList.get("x-forwarded-for");
      const xRealIp = headersList.get("x-real-ip");
      let ipAddress = "127.0.0.1";
      if (xForwardedFor) {
        ipAddress = xForwardedFor.split(",")[0].trim();
      } else if (xRealIp) {
        ipAddress = xRealIp.trim();
      }

      db.auditLog
        .create({
          data: {
            userId: user.id,
            action: "ai.generate",
            targetType: "AIService",
            ipAddress,
            metadata: {
              promptLength: prompt.length,
              resultLength: textResult.length,
            },
          },
        })
        .catch((err) => {
          logger.error({ err }, "Failed to write audit log for AI generation");
        });
     
    } catch (_ipErr) {
      db.auditLog
        .create({
          data: {
            userId: user.id,
            action: "ai.generate",
            targetType: "AIService",
            metadata: {
              promptLength: prompt.length,
              resultLength: textResult.length,
            },
          },
        })
        .catch((err) => {
          logger.error({ err }, "Failed to write fallback audit log for AI generation");
        });
    }

    return NextResponse.json({ text: textResult });
  } catch (error) {
    logger.error({ error }, "Error in /api/ai route");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(
  aiLimiter,
  async () => {
    const user = await getCurrentUser();
    return user ? `api-ai-${user.id}` : `api-ai-anon-${await getClientIp()}`;
  },
  handler
);
