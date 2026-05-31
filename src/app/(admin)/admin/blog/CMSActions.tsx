"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { createPost, deletePost, publishPost } from "@/lib/actions/blog";

interface CMSActionsProps {
  action: "create-button" | "row-actions";
  postId?: string;
  published?: boolean;
}

export default function CMSActions({ action, postId, published }: CMSActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const slug = "draft-post-" + Math.random().toString(36).substring(2, 7);
      const newPost = await createPost({
        title: "Untitled Draft",
        slug,
        content: "<p>Start writing your thoughts here...</p>",
        excerpt: "",
        coverImage: "",
        seoTitle: "",
        seoDescription: "",
        tags: [],
      });
      router.push(`/admin/blog/${newPost.id}/edit`);
     
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create post";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!confirm("Are you sure you want to delete this blog post? This action is irreversible.")) return;

    setLoading(true);
    try {
      await deletePost(postId);
      router.refresh();
     
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete post";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      await publishPost(postId, !published);
      router.refresh();
     
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update publish state";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (action === "create-button") {
    return (
      <button
        onClick={handleCreate}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <span>New Post</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleTogglePublish}
        disabled={loading}
        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
          published
            ? "border-zinc-900 bg-zinc-900/40 hover:bg-zinc-800 text-yellow-500"
            : "border-zinc-900 bg-zinc-900/40 hover:bg-zinc-800 text-emerald-500"
        }`}
        title={published ? "Unpublish post" : "Publish post"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : published ? (
          <ArrowDownCircle className="h-4 w-4" />
        ) : (
          <ArrowUpCircle className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 rounded-lg border border-zinc-900 bg-zinc-900/40 hover:bg-red-950/20 text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
        title="Delete post"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </>
  );
}
