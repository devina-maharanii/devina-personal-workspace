import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import EditorClientWrapper from "./EditorClientWrapper";
import { constructMetadata } from "@/lib/seo";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = constructMetadata({
  title: "Edit Blog Post | Admin CMS",
  description: "Compose or update an article with rich text styling, autosave, and SEO analysis.",
  noIndex: true,
});

export default async function EditPostPage(props: EditPostPageProps) {
  // 1. Verify admin permissions
  await requireAdmin();

  const { id } = await props.params;

  // 2. Query blog post
  const post = await db.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  // 3. Query last 5 history versions
  const versions = await db.blogPostVersion.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-2 sm:p-4">
      <Suspense fallback={<div className="h-[80vh] w-full rounded-2xl bg-zinc-900/50 animate-pulse border border-zinc-800" />}>
        <EditorClientWrapper post={post} versions={versions} />
      </Suspense>
    </div>
  );
}
