"use server";

 
import { db } from "@/lib/db";
import { requireAuth, getActiveOrg } from "@/lib/auth";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { z } from "zod";

/** Whitelist of supported AI model identifiers (BUG-20). */
export const SUPPORTED_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "claude-3-5-sonnet-20241022",
  "claude-3-haiku-20240307",
  "gpt-4o",
  "gpt-4o-mini",
] as const;

export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

const ConversationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  model: z.enum(SUPPORTED_MODELS, {
    error: `Model must be one of: ${SUPPORTED_MODELS.join(", ")}`,
  }),
});

/**
 * Resolves the active user's organization scope.
 */
async function getOrgContext(userId: string) {
  const org = await getActiveOrg(userId);
  return org.id;
}

/**
 * Asserts that the user has write access to the organization (i.e. is not a VIEWER).
 */
async function requireWriteAccess(userId: string, orgId: string) {
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: orgId,
      },
    },
  });
  if (membership?.role === "VIEWER") {
    throw new ForbiddenError("Viewers are not authorized to perform write operations.");
  }
}

/**
 * Fetches all conversations belonging to the user's current organization.
 */
export async function getConversationsAction() {
  const user = await requireAuth();
  const orgId = await getOrgContext(user.id);

  return await db.conversation.findMany({
    where: {
      organizationId: orgId,
      userId: user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      model: true,
      updatedAt: true,
    },
  });
}

/**
 * Fetches all messages for a specific conversation.
 */
export async function getConversationMessagesAction(conversationId: string) {
  const user = await requireAuth();
  const orgId = await getOrgContext(user.id);
  
  // Validate that the conversation belongs to the user and the active organization
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || conversation.userId !== user.id || conversation.organizationId !== orgId) {
    throw new ForbiddenError("Unauthorized conversation access.");
  }

  return await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      fileUrl: true,
      createdAt: true,
    },
  });
}

/**
 * Creates a new conversation in the database.
 */
export async function createConversationAction(title: string, model: string) {
  const user = await requireAuth();
  const orgId = await getOrgContext(user.id);

  // Enforce write access check (block viewers)
  await requireWriteAccess(user.id, orgId);

  // BUG-20: Validate title and model against the supported whitelist
  const parsed = ConversationSchema.safeParse({ title, model });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid conversation parameters");
  }

  const conversation = await db.conversation.create({
    data: {
      title,
      model,
      userId: user.id,
      organizationId: orgId,
    },
  });

  // Log action
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Created Chat Conversation: ${title}`,
      targetType: "Conversation",
      targetId: conversation.id,
    },
  });

  return conversation;
}

/**
 * Deletes a conversation from the database.
 */
export async function deleteConversationAction(conversationId: string) {
  const user = await requireAuth();
  const orgId = await getOrgContext(user.id);

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  // Validate ownership and organization scope
  if (!conversation || conversation.userId !== user.id || conversation.organizationId !== orgId) {
    throw new ForbiddenError("Unauthorized delete action.");
  }

  // Enforce write access check (block viewers)
  await requireWriteAccess(user.id, orgId);

  await db.conversation.delete({
    where: { id: conversationId },
  });

  // Log action
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Deleted Chat Conversation: ${conversation.title}`,
      targetType: "Conversation",
      targetId: conversationId,
    },
  });

  return { success: true };
}

/**
 * Creates a draft blog post from generated AI content.
 */
export async function createDraftBlogPostAction(title: string, content: string) {
  const user = await requireAuth();
  const org = await getActiveOrg(user.id);

  // Enforce write access check (block viewers)
  await requireWriteAccess(user.id, org.id);

  // Generate safe unique slug
  const cleanSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${cleanSlug || "draft"}-${Date.now()}`;

  const post = await db.blogPost.create({
    data: {
      title: title || "AI Generated Draft",
      slug,
      content,
      published: false,
      authorId: user.id,
      organizationId: org.id,
    },
  });

  // Log audit activity
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Created Blog Draft from AI Content: ${post.title}`,
      targetType: "BlogPost",
      targetId: post.id,
    },
  });

  return post;
}

