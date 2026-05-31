import { NextResponse } from "next/server";
import { getCurrentUser, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { withRateLimit, aiLimiter, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";

type ToolStreamMessages = Parameters<typeof streamText>[0]["messages"];
type ToolMessage = NonNullable<ToolStreamMessages>[number];
type ToolContent = ToolMessage["content"];

const SummarizePayloadSchema = z
  .object({
    text: z.string().min(1, "Text is required."),
    style: z.string().optional(),
    length: z.string().optional(),
  })
  .passthrough();

const GeneratePayloadSchema = z
  .object({
    template: z.string().optional(),
    tone: z.string().optional(),
    language: z.string().optional(),
    topic: z.string().min(1, "Topic is required."),
  })
  .passthrough();

const VisionPayloadSchema = z
  .object({
    analysisType: z.string().optional(),
    imageUrl: z.string().min(1, "Image URL is required."),
  })
  .passthrough();

const ToolRequestSchema = z.discriminatedUnion("tool", [
  z.object({ tool: z.literal("summarize"), payload: SummarizePayloadSchema }),
  z.object({ tool: z.literal("generate"), payload: GeneratePayloadSchema }),
  z.object({ tool: z.literal("vision"), payload: VisionPayloadSchema }),
]);

const isAllowedImageUrl = (value: string) => {
  try {
    const u = new URL(value);
    const isDev = process.env.NODE_ENV !== "production";
    const isAllowedProtocol = u.protocol === "https:" || (isDev && u.protocol === "http:");
    const allowedHosts = new Set(["utfs.io", "uploadthing.com", "www.uploadthing.com"]);
    if (isDev) allowedHosts.add("localhost:3000");
    return isAllowedProtocol && allowedHosts.has(u.host);
  } catch {
    return false;
  }
};

async function handler(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getActiveOrg(user.id);
    const clientIp = await getClientIp();

    // Limit credit check
    if (org.usedAiCredits >= org.maxAiCredits) {
      return NextResponse.json({ error: "CREDITS_EXHAUSTED" }, { status: 402 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ToolRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tool request." }, { status: 400 });
    }

    const { tool, payload } = parsed.data;

    let systemPrompt = "You are a helpful AI assistant.";
    let promptContent: ToolContent = "";

    // 1. Tool type mapping
    if (tool === "summarize") {
      const { text, style, length } = payload;
      systemPrompt = "You are an expert document summarizer.";
      promptContent = `Summarize the following text:
---
${text}
---
Use summary style: ${style ?? ""} (if Q&A, format as Q&A; if Brief, use precisely 3 bullet points; otherwise write continuous paragraphs).
Target length constraint: ${length ?? ""} (e.g. short/medium/long).`;
    } 
    
    else if (tool === "generate") {
      const { template, tone, language, topic } = payload;
      systemPrompt = "You are a professional copywriting assistant.";
      promptContent = `Write a ${template} about: "${topic}".
Tone: ${tone}
Language: ${language}
Return clean, production-ready markdown formatting. Do NOT wrap the response in any markdown code block itself unless writing code.`;
    } 
    
    else if (tool === "vision") {
      const { analysisType, imageUrl } = payload;
      if (!isAllowedImageUrl(imageUrl)) {
        return NextResponse.json({ error: "Invalid imageUrl" }, { status: 400 });
      }
      systemPrompt = "You are an expert computer vision model.";
      
      let typeDesc = "Describe this image in detail.";
      if (analysisType === "ocr") typeDesc = "Extract and transcribe all readable text from this image. Keep layout.";
      else if (analysisType === "objects") typeDesc = "Identify all objects visible in this image and list them.";
      else if (analysisType === "alt") typeDesc = "Generate a concise, descriptive accessibility alt text for this image.";

      promptContent = [
        { type: "text", text: typeDesc },
        { type: "image", image: imageUrl },
      ];
    }

    const toolMessages: NonNullable<ToolStreamMessages> = [
      {
        role: "user",
        content: promptContent,
      },
    ];

    // Call Vercel AI SDK
    const result = streamText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      system: systemPrompt,
      messages: toolMessages,
       
      onFinish: async ({ usage }) => {
        const promptTokens = usage.inputTokens || 0;
        const completionTokens = usage.outputTokens || 0;
        const totalTokens = usage.totalTokens || (promptTokens + completionTokens);

        const creditsToCharge = Math.max(1, Math.round(totalTokens / 150));

        await db.$transaction([
          db.organization.update({
            where: { id: org.id },
            data: {
              usedAiCredits: { increment: creditsToCharge },
            },
          }),
          db.aiUsageLog.create({
            data: {
              organizationId: org.id,
              userId: user.id,
              model: "claude-3-5-sonnet-20241022",
              promptTokens,
              completionTokens,
              totalTokens,
              cost: totalTokens * 0.000015,
              feature: tool,
            },
          }),
          db.auditLog.create({
            data: {
              userId: user.id,
              action: `Used AI Tool: ${tool}`,
              targetType: "AiTool",
              targetId: tool,
              ipAddress: clientIp,
            },
          }),
        ]);
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal tool streaming error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export const POST = withRateLimit(
  aiLimiter,
  async () => {
    const user = await getCurrentUser();
    return user ? `api-ai-tools-${user.id}` : `api-ai-tools-anon-${await getClientIp()}`;
  },
  handler
);
