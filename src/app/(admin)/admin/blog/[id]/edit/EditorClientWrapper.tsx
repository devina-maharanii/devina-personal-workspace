"use client";

import dynamic from "next/dynamic";
import type { BlogPost, BlogPostVersion } from "@prisma/client";
import { Loader2 } from "lucide-react";

const BlogEditor = dynamic(() => import("./BlogEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading Editor...</span>
      </div>
    </div>
  ),
});

type BlogPostSerializable = Omit<BlogPost, "createdAt" | "updatedAt" | "publishedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  publishedAt: string | Date | null;
};

type BlogPostVersionSerializable = Omit<BlogPostVersion, "createdAt"> & {
  createdAt: string | Date;
};

interface EditorClientWrapperProps {
  post: BlogPostSerializable;
  versions: BlogPostVersionSerializable[];
}

export default function EditorClientWrapper({ post, versions }: EditorClientWrapperProps) {
  return <BlogEditor post={post} versions={versions} />;
}
