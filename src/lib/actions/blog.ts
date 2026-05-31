"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, getActiveOrg } from "@/lib/auth";
import { z } from "zod";
import { createBulkNotifications } from "@/lib/notifications";
import { triggerWebhook } from "@/lib/webhooks";
import { captureEvent } from "@/lib/posthog";
import { ANALYTICS_EVENTS } from "@/lib/constants";
import DOMPurify from "isomorphic-dompurify";

// Zod validation schemas
export const BlogPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(150, "Title must be under 150 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be under 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  content: z.string().min(10, "Content must be at least 10 characters long").max(50000, "Content must be under 50000 characters"),
  excerpt: z.string().max(500, "Excerpt must be under 500 characters").optional(),
  coverImage: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  seoTitle: z.string().max(150, "SEO Title must be under 150 characters").optional(),
  seoDescription: z.string().max(300, "SEO Description must be under 300 characters").optional(),
  tags: z.array(z.string()).default([]),
});

export type BlogPostInput = z.infer<typeof BlogPostSchema>;

/**
 * Creates a new blog post draft, resolving active organization contexts safely.
 */
export async function createPost(data: BlogPostInput) {
  const user = await requireAdmin();
  const parsed = BlogPostSchema.parse(data);

  // Check if slug is unique
  const existing = await db.blogPost.findUnique({
    where: { slug: parsed.slug },
  });
  if (existing) {
    throw new Error("A blog post with this slug already exists.");
  }

  // Resolve user's organization context
  const org = await getActiveOrg(user.id);
  const organizationId = org.id;

  // Sanitize editor HTML and text excerpt before storing in DB
  const sanitizedContent = DOMPurify.sanitize(parsed.content, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allowfullscreen", "frameborder", "width", "height"],
  });

  const sanitizedExcerpt = parsed.excerpt
    ? DOMPurify.sanitize(parsed.excerpt, { ALLOWED_TAGS: [] })
    : null;

  const post = await db.blogPost.create({
    data: {
      title: parsed.title,
      slug: parsed.slug,
      content: sanitizedContent,
      excerpt: sanitizedExcerpt,
      coverImage: parsed.coverImage || null,
      seoTitle: parsed.seoTitle || null,
      seoDescription: parsed.seoDescription || null,
      tags: parsed.tags,
      published: false,
      authorId: user.id,
      organizationId,
    },
  });

  // Initial version history creation
  await db.blogPostVersion.create({
    data: {
      postId: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
    },
  });

  captureEvent(user.id, ANALYTICS_EVENTS.BLOG_POST_CREATED);

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return post;
}

/**
 * Updates a blog post and records a version history snapshot, retaining the last 5 saves.
 */
export async function updatePost(id: string, data: Partial<BlogPostInput>) {
   
  const _user = await requireAdmin();
  const parsed = BlogPostSchema.partial().parse(data);
  
  // Clean empty inputs to be safe and sanitize accordingly
   
  const updateData: Prisma.BlogPostUpdateInput = {};
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.slug !== undefined) updateData.slug = parsed.slug;
  
  if (parsed.content !== undefined) {
    updateData.content = DOMPurify.sanitize(parsed.content, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allowfullscreen", "frameborder", "width", "height"],
    });
  }

  if (parsed.excerpt !== undefined) {
    updateData.excerpt = parsed.excerpt
      ? DOMPurify.sanitize(parsed.excerpt, { ALLOWED_TAGS: [] })
      : null;
  }

  if (parsed.coverImage !== undefined) updateData.coverImage = parsed.coverImage || null;
  if (parsed.seoTitle !== undefined) updateData.seoTitle = parsed.seoTitle || null;
  if (parsed.seoDescription !== undefined) updateData.seoDescription = parsed.seoDescription || null;
  if (parsed.tags !== undefined) updateData.tags = parsed.tags;

  // Validate if full update
  if (parsed.slug) {
    const existing = await db.blogPost.findFirst({
      where: { slug: parsed.slug, NOT: { id } },
    });
    if (existing) {
      throw new Error("A blog post with this slug already exists.");
    }
  }

  const updated = await db.blogPost.update({
    where: { id },
    data: updateData,
  });

  // Save new history version
  await db.blogPostVersion.create({
    data: {
      postId: id,
      title: updated.title,
      content: updated.content,
      excerpt: updated.excerpt,
      coverImage: updated.coverImage,
    },
  });

  // Keep only the last 5 versions
  const versions = await db.blogPostVersion.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
  });

  if (versions.length > 5) {
    const toDelete = versions.slice(5);
    await db.blogPostVersion.deleteMany({
      where: {
        id: { in: toDelete.map((v) => v.id) },
      },
    });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${updated.slug}`);
  revalidatePath("/admin/blog");
  return updated;
}

/**
 * Deletes a post, cascade-deleting automatic history logs.
 */
export async function deletePost(id: string) {
  await requireAdmin();
  
  const deleted = await db.blogPost.delete({
    where: { id },
  });

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return deleted;
}

/**
 * Toggles draft/published state on a post.
 */
export async function publishPost(id: string, published: boolean) {
  await requireAdmin();

  const updated = await db.blogPost.update({
    where: { id },
    data: {
      published,
      publishedAt: published ? new Date() : null,
    },
  });

  if (published) {
    try {
      const memberships = await db.membership.findMany({
        where: { organizationId: updated.organizationId },
        select: { userId: true },
      });
      const userIds = memberships.map((m) => m.userId);
      if (userIds.length > 0) {
        await createBulkNotifications(userIds, {
          title: "New Blog Post Published",
          message: `The blog post "${updated.title}" has been successfully published to the live feed.`,
          type: "success",
          link: `/blog/${updated.slug}`,
          category: "blog",
        });
      }

      await triggerWebhook(updated.organizationId, 'blog.post_published', {
        postId: updated.id,
        title: updated.title,
        slug: updated.slug,
        authorId: updated.authorId,
      });

      captureEvent(updated.authorId, ANALYTICS_EVENTS.BLOG_POST_PUBLISHED);
    } catch (error) {
      console.error("Failed to dispatch blog publish notification", error);
    }
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${updated.slug}`);
  revalidatePath("/admin/blog");
  return updated;
}

/**
 * Reverts to a previous historical version draft.
 */
export async function revertToVersion(postId: string, versionId: string) {
  await requireAdmin();

  const version = await db.blogPostVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.postId !== postId) {
    throw new Error("Historical version not found.");
  }

  const updated = await db.blogPost.update({
    where: { id: postId },
    data: {
      title: version.title,
      content: version.content,
      excerpt: version.excerpt,
      coverImage: version.coverImage,
    },
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${updated.slug}`);
  revalidatePath("/admin/blog");
  return updated;
}
