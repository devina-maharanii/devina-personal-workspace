/* eslint-disable @next/next/no-img-element */
"use client";

import { UploadDropzone } from "@/lib/uploadthing";

interface MetadataSidebarProps {
  coverImage: string;
  setCoverImage: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  tagsInput: string;
  setTagsInput: (val: string) => void;
  excerpt: string;
  setExcerpt: (val: string) => void;
  seoTitle: string;
  setSeoTitle: (val: string) => void;
  seoDescription: string;
  setSeoDescription: (val: string) => void;
  titleFallback: string;
}

export default function MetadataSidebar({
  coverImage,
  setCoverImage,
  slug,
  setSlug,
  tagsInput,
  setTagsInput,
  excerpt,
  setExcerpt,
  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  titleFallback,
}: MetadataSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Cover Photo selector */}
      <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cover Image</h3>
        {coverImage ? (
          <div className="space-y-3">
            <div className="aspect-video relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-850">
              <img src={coverImage} alt="Cover preview" className="object-cover w-full h-full" />
            </div>
            <button
              onClick={() => setCoverImage("")}
              className="w-full text-center text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline transition-colors cursor-pointer"
            >
              Remove Cover Image
            </button>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-xl bg-zinc-950 p-4">
            <UploadDropzone
              endpoint="blogImage"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setCoverImage(res[0].url);
                }
              }}
              onUploadError={(err) => {
                alert(`Image upload error: ${err.message}`);
              }}
            />
          </div>
        )}
      </div>

      {/* Excerpts, slugs, tags fields */}
      <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-2xl space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Metadata Settings</h3>

        {/* Custom Slug input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400">Custom Slug URL</label>
          <div className="flex border border-zinc-850 rounded-xl bg-zinc-900/40 overflow-hidden">
            <span className="bg-zinc-900 border-r border-zinc-850 px-3 py-2 text-zinc-500 text-xs">/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
              className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
              placeholder="custom-slug-url"
            />
          </div>
        </div>

        {/* Tags input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full border border-zinc-850 rounded-xl bg-zinc-900/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
            placeholder="news, AI, engineering"
          />
        </div>

        {/* Excerpt brief */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400">Brief Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full border border-zinc-850 rounded-xl bg-zinc-900/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
            placeholder="Provide a brief summary of this article to display on index listings..."
          />
        </div>
      </div>

      {/* Dedicated SEO panel */}
      <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-2xl space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">SEO Configurations</h3>

        {/* SEO Title */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400">SEO Custom Title</label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full border border-zinc-850 rounded-xl bg-zinc-900/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
            placeholder={titleFallback || "SEO Custom Title"}
          />
        </div>

        {/* SEO Description */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400">SEO Meta Description</label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            className="w-full border border-zinc-850 rounded-xl bg-zinc-900/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
            placeholder={excerpt || "Search description..."}
          />
        </div>
      </div>
    </aside>
  );
}
