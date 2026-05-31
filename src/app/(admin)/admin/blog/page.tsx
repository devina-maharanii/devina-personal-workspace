import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { BlogCMSPageClient } from "@/components/admin/BlogCMSPageClient";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Blog CMS | Admin Dashboard",
  description: "Manage system-wide blog posts, edits, status triggers, and reports.",
  noIndex: true,
});

/**
 * Server page resolver for the administrator Blog CMS directory.
 */
export default async function AdminBlogPage() {
  // 1. Verify administrative privileges
  await requireAdmin();

  // 2. Fetch all system posts across all organizations
  const posts = await db.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  return <BlogCMSPageClient initialPosts={posts} />;
}
