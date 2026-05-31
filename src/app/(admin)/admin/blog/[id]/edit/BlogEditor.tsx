/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { formatDistanceToNow } from "date-fns";

import {
  ArrowLeft,
  Globe,
  Settings,
  History,
  Eye,
  Sparkles,
} from "lucide-react";
import LinkNext from "next/link";
import { updatePost, publishPost, revertToVersion } from "@/lib/actions/blog";
import type { BlogPost, BlogPostVersion } from "@prisma/client";

// Import modular subcomponents
import EditorToolbar from "./components/EditorToolbar";
import MetadataSidebar from "./components/MetadataSidebar";
import SEOPreview from "./components/SEOPreview";
import VersionHistory from "./components/VersionHistory";
import LivePreview from "./components/LivePreview";

type BlogPostSerializable = Omit<BlogPost, "createdAt" | "updatedAt" | "publishedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  publishedAt: string | Date | null;
};

type BlogPostVersionSerializable = Omit<BlogPostVersion, "createdAt"> & {
  createdAt: string | Date;
};

interface BlogEditorProps {
  post: BlogPostSerializable;
  versions: BlogPostVersionSerializable[];
}

export default function BlogEditor({ post, versions }: BlogEditorProps) {
  const router = useRouter();

  // 1. Post core state variables
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [coverImage, setCoverImage] = useState(post.coverImage || "");
  const [seoTitle, setSeoTitle] = useState(post.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(post.seoDescription || "");
  const [tagsInput, setTagsInput] = useState(post.tags.join(", "));
  const [published, setPublished] = useState(post.published);

  // 2. Editor state managers
  const [editorContent, setEditorContent] = useState(post.content);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(
    post.updatedAt ? new Date(post.updatedAt) : null
  );
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "seo" | "history">("edit");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const isFirstRender = useRef(true);

  // 3. Tiptap config
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-400 underline font-semibold hover:text-indigo-300 transition-colors",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "rounded-2xl border border-zinc-800 my-6 max-w-full shadow-lg shadow-zinc-950/40",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-zinc-800 w-full my-6 text-sm",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-zinc-850 bg-zinc-900 p-2.5 font-bold text-zinc-350 text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-zinc-850 p-2.5 text-zinc-400",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2 my-1.5",
        },
      }),
    ],
    content: post.content,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none prose-sm sm:prose-base focus:outline-none min-h-[400px] p-6 text-zinc-300",
      },
    },
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
      setSaveStatus("unsaved");
    },
  });

  // 4. Autosave Debouncer
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus("unsaved");
    const tags = tagsInput
      .split(",")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updatePost(post.id, {
          title,
          slug,
          content: editorContent,
          excerpt,
          coverImage,
          seoTitle,
          seoDescription,
          tags,
        });
        setSaveStatus("saved");
        setLastSaved(new Date());
        router.refresh();
       
      } catch (err: unknown) {
        console.error("Autosave failed: ", err);
        setSaveStatus("unsaved");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, slug, editorContent, excerpt, coverImage, seoTitle, seoDescription, tagsInput]);

  // Handle document publish toggles
  const handleTogglePublish = async () => {
    setSaveStatus("saving");
    try {
      const nextPub = !published;
      await publishPost(post.id, nextPub);
      setPublished(nextPub);
      setSaveStatus("saved");
      setLastSaved(new Date());
      router.refresh();
     
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to publish";
      alert(message);
      setSaveStatus("unsaved");
    }
  };

  // Revert back to historical draft snapshot
  const handleRevert = async (versionId: string) => {
    if (
      !confirm("Are you sure you want to revert this post to the historical save? Current unsaved edits will be replaced.")
    ) {
      return;
    }
    setSaveStatus("saving");
    try {
      const rev = await revertToVersion(post.id, versionId);
      setTitle(rev.title);
      setSlug(rev.slug);
      setExcerpt(rev.excerpt || "");
      setCoverImage(rev.coverImage || "");
      editor?.commands.setContent(rev.content);
      setEditorContent(rev.content);
      setSaveStatus("saved");
      setLastSaved(new Date());
      router.refresh();
     
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to revert";
      alert(message);
      setSaveStatus("unsaved");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto text-white pb-12">
      {/* Editor Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <LinkNext
            href="/admin/blog"
            className="p-2 rounded-xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </LinkNext>
          <div>
            <h1 className="text-xl font-extrabold text-white truncate max-w-[300px]">
              {title || "Untitled Draft"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  saveStatus === "saving"
                    ? "bg-amber-400 animate-pulse"
                    : saveStatus === "saved"
                    ? "bg-emerald-500"
                    : "bg-red-400"
                }`}
              />
              <span className="text-[10px] text-zinc-400">
                {saveStatus === "saving"
                  ? "Saving changes..."
                  : saveStatus === "saved"
                  ? `Saved ${lastSaved ? formatDistanceToNow(lastSaved) + " ago" : ""}`
                  : "Unsaved Changes"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePublish}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              published
                ? "bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>{published ? "Switch to Draft" : "Publish Article"}</span>
          </button>
        </div>
      </div>

      {/* Editor Grid Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Text Editor and Live Preview panels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Workspace Tabs header */}
          <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "edit" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Settings className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "preview" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Preview Mode
            </button>
            <button
              onClick={() => setActiveTab("seo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "seo" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> SEO Preview
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "history" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <History className="h-3.5 w-3.5" /> History
            </button>
          </div>

          {/* TAB 1: Core Tiptap Editor & Styling Toolbar */}
          {activeTab === "edit" && (
            <div className="border border-zinc-900 bg-zinc-950/40 rounded-2xl overflow-hidden">
              <EditorToolbar editor={editor} />

              {/* Title input field inside editor fold */}
              <div className="p-6 border-b border-zinc-900">
                <input
                  type="text"
                  placeholder="Post Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-2xl font-black text-white focus:outline-none placeholder-zinc-700"
                />
              </div>

              {/* Content text block */}
              <EditorContent editor={editor} />
            </div>
          )}

          {/* TAB 2: Device Responsive Viewport Live Preview */}
          {activeTab === "preview" && (
            <LivePreview
              title={title}
              coverImage={coverImage}
              excerpt={excerpt}
              editorContent={editorContent}
              previewDevice={previewDevice}
              setPreviewDevice={setPreviewDevice}
            />
          )}

          {/* TAB 3: Google SEO Analyzer Overlays */}
          {activeTab === "seo" && (
            <SEOPreview
              slug={slug}
              title={title}
              seoTitle={seoTitle}
              excerpt={excerpt}
              seoDescription={seoDescription}
            />
          )}

          {/* TAB 4: Version history snap list */}
          {activeTab === "history" && (
            <VersionHistory
              versions={versions}
              handleRevert={handleRevert}
            />
          )}
        </div>

        {/* Right Side: Sidebar Metadata panel */}
        <div className="lg:col-span-4">
          <MetadataSidebar
            coverImage={coverImage}
            setCoverImage={setCoverImage}
            slug={slug}
            setSlug={setSlug}
            tagsInput={tagsInput}
            setTagsInput={setTagsInput}
            excerpt={excerpt}
            setExcerpt={setExcerpt}
            seoTitle={seoTitle}
            setSeoTitle={setSeoTitle}
            seoDescription={seoDescription}
            setSeoDescription={setSeoDescription}
            titleFallback={title}
          />
        </div>
      </div>
    </div>
  );
}
