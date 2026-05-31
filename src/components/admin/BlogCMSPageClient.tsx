"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Loader2, 
  User, 
  Calendar, 
  Edit2, 
  FileText, 
  CheckCircle, 
  Eye, 
  AlertTriangle,
  Search,
  Globe
} from "lucide-react";
import { createPost, deletePost, publishPost } from "@/lib/actions/blog";
import { getErrorMessage } from "@/lib/utils";

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  reportCount: number;
  coverImage?: string | null;
  author?: {
    name: string | null;
    email: string | null;
    avatarUrl?: string | null;
  } | null;
  organization?: {
    name: string | null;
    slug?: string | null;
  } | null;
}

interface BlogCMSPageClientProps {
   
  initialPosts: BlogPostItem[];
}

export function BlogCMSPageClient({ initialPosts }: BlogCMSPageClientProps) {
  const router = useRouter();
   
  const [posts, setPosts] = useState<BlogPostItem[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "REPORTED">("ALL");
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [_isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // New draft post creation
  const handleCreate = async () => {
    setLoadingAction("create");
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
      alert(getErrorMessage(error, "Failed to create post"));
    } finally {
      setLoadingAction(null);
    }
  };

  // Toggle Publish for a single post
  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    setLoadingAction(`publish-${id}`);
    try {
      await publishPost(id, !currentPublished);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id 
            ? { ...post, published: !currentPublished, publishedAt: !currentPublished ? new Date() : null } 
            : post
        )
      );
      router.refresh();
     
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to update publish state"));
    } finally {
      setLoadingAction(null);
    }
  };

  // Delete a single post
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post? This action is irreversible.")) return;
    setLoadingAction(`delete-${id}`);
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      router.refresh();
     
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to delete post"));
    } finally {
      setLoadingAction(null);
    }
  };

  // Bulk publish selected
  const handleBulkPublish = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to publish all ${selectedIds.length} selected posts?`)) return;

    setLoadingAction("bulk-publish");
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => publishPost(id, true)));
        setPosts((prev) =>
          prev.map((post) =>
            selectedIds.includes(post.id) 
              ? { ...post, published: true, publishedAt: new Date() } 
              : post
          )
        );
        setSelectedIds([]);
        router.refresh();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Some posts failed to publish during bulk action."));
      } finally {
        setLoadingAction(null);
      }
    });
  };

  // Bulk delete selected
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete all ${selectedIds.length} selected posts? This action cannot be undone.`)) return;

    setLoadingAction("bulk-delete");
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => deletePost(id)));
        setPosts((prev) => prev.filter((post) => !selectedIds.includes(post.id)));
        setSelectedIds([]);
        router.refresh();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Some posts failed to delete during bulk action."));
      } finally {
        setLoadingAction(null);
      }
    });
  };

  // Row selection toggling
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible posts
   
  const handleSelectAll = (visiblePosts: BlogPostItem[]) => {
    const visibleIds = visiblePosts.map((p) => p.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Filtering and Searching
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.author?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.author?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.organization?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "PUBLISHED") return post.published;
    if (activeTab === "DRAFT") return !post.published;
    if (activeTab === "REPORTED") return post.reportCount > 0;
    return true;
  });

  // Calculate metrics
  const totalCount = posts.length;
  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = totalCount - publishedCount;
  const reportedCount = posts.filter((p) => p.reportCount > 0).length;

  return (
    <div className="space-y-8 text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-400" />
            Blog CMS Directory
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Manage system-wide blog posts, publish states, organization articles, and reported publications.
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={loadingAction === "create"}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {loadingAction === "create" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span>New Post</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Total Posts</p>
          <p className="text-2xl font-extrabold text-white">{totalCount}</p>
        </div>
        <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Published</p>
          <p className="text-2xl font-extrabold text-emerald-400">{publishedCount}</p>
        </div>
        <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Drafts</p>
          <p className="text-2xl font-extrabold text-indigo-400">{draftCount}</p>
        </div>
        <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Flagged Posts</p>
          <p className={`text-2xl font-extrabold ${reportedCount > 0 ? "text-red-400" : "text-zinc-400"}`}>
            {reportedCount}
          </p>
        </div>
      </div>

      {/* Bulk actions banner if selected */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <p className="text-xs font-bold text-indigo-200">
              {selectedIds.length} articles selected for bulk action
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkPublish}
              disabled={loadingAction === "bulk-publish"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-xxs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingAction === "bulk-publish" && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Publish Selected</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={loadingAction === "bulk-delete"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-900/30 hover:bg-red-900/20 text-xxs font-bold text-red-400 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingAction === "bulk-delete" && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xxs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Title, Author, or Organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/30 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-950/60 p-1 border border-zinc-850 rounded-xl w-fit self-start md:self-auto">
          {(["ALL", "PUBLISHED", "DRAFT", "REPORTED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedIds([]);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xxs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === tab 
                  ? "bg-zinc-850 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-zinc-850 bg-zinc-950 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-850 bg-zinc-900/40 text-zinc-400">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredPosts.length > 0 &&
                      filteredPosts.every((p) => selectedIds.includes(p.id))
                    }
                    onChange={() => handleSelectAll(filteredPosts)}
                    className="rounded border-zinc-800 bg-zinc-950 text-indigo-650 focus:ring-indigo-650 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-bold">Article Title</th>
                <th className="p-4 font-bold">Author</th>
                <th className="p-4 font-bold">Organization</th>
                <th className="p-4 font-bold">Date Created</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Reports</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-550 font-medium">
                    No matching articles found in database.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const isSelected = selectedIds.includes(post.id);
                  const isActionLoading = loadingAction?.includes(post.id);

                  return (
                    <tr 
                      key={post.id} 
                      className={`transition-colors hover:bg-zinc-900/20 ${
                        isSelected ? "bg-indigo-950/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(post.id)}
                          className="rounded border-zinc-800 bg-zinc-950 text-indigo-650 focus:ring-indigo-650 cursor-pointer"
                        />
                      </td>

                      {/* Cover & Title */}
                      <td className="p-4 flex items-center gap-3">
                        {post.coverImage ? (
                          <div className="h-10 w-16 relative overflow-hidden rounded bg-zinc-900 border border-zinc-850 shrink-0">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-16 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-650 shrink-0">
                            <FileText className="h-4.5 w-4.5 text-zinc-550" />
                          </div>
                        )}
                        <div className="max-w-[280px]">
                          <p className="font-bold text-white truncate" title={post.title}>
                            {post.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            /{post.slug}
                          </p>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="p-4 text-zinc-300">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-zinc-550" />
                          <div>
                            <p className="font-semibold">{post.author?.name || "Staff Member"}</p>
                            <p className="text-[9px] text-zinc-550">{post.author?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Organization Column */}
                      <td className="p-4 font-semibold text-zinc-400">
                        {post.organization?.name ? (
                          <span className="text-zinc-300 flex items-center gap-1">
                            <Globe className="h-3 w-3 text-zinc-500" />
                            <span>{post.organization.name}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">— Global Staff</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-zinc-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-550" />
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {post.published ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                            <CheckCircle className="h-2.5 w-2.5" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Reports */}
                      <td className="p-4">
                        {post.reportCount > 0 ? (
                          <Link 
                            href="/admin/moderation"
                            className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                            <span>{post.reportCount} Flagged</span>
                          </Link>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.published && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors"
                              title="View article page"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          )}
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="p-1.5 rounded-lg border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors"
                            title="Edit article inside Tiptap editor"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>

                          {/* Toggle publish button */}
                          <button
                            onClick={() => handleTogglePublish(post.id, post.published)}
                            disabled={isActionLoading}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              post.published
                                ? "border-zinc-900 bg-zinc-900/40 hover:bg-zinc-850 text-yellow-500"
                                : "border-zinc-900 bg-zinc-900/40 hover:bg-zinc-850 text-emerald-500"
                            }`}
                            title={post.published ? "Unpublish post" : "Publish post"}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : post.published ? (
                              <ArrowDownCircle className="h-4 w-4" />
                            ) : (
                              <ArrowUpCircle className="h-4 w-4" />
                            )}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={isActionLoading}
                            className="p-1.5 rounded-lg border border-zinc-900 bg-zinc-900/40 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete post"
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
