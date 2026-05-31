/* eslint-disable @next/next/no-img-element */
"use client";

import { Laptop, Smartphone } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

interface LivePreviewProps {
  title: string;
  coverImage: string;
  excerpt: string;
  editorContent: string;
  previewDevice: "desktop" | "mobile";
  setPreviewDevice: (val: "desktop" | "mobile") => void;
}

export default function LivePreview({
  title,
  coverImage,
  excerpt,
  editorContent,
  previewDevice,
  setPreviewDevice,
}: LivePreviewProps) {
  return (
    <div className="space-y-4">
      {/* Preview view controller */}
      <div className="flex items-center gap-2 border border-zinc-900 bg-zinc-900/10 p-2.5 rounded-xl">
        <span className="text-[10px] text-zinc-500 font-bold uppercase mr-auto pl-1">
          Responsive Viewport
        </span>
        <button
          onClick={() => setPreviewDevice("desktop")}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            previewDevice === "desktop" ? "bg-zinc-850 text-indigo-400" : "text-zinc-400 hover:text-white"
          }`}
          title="Desktop viewport"
        >
          <Laptop className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPreviewDevice("mobile")}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            previewDevice === "mobile" ? "bg-zinc-850 text-indigo-400" : "text-zinc-400 hover:text-white"
          }`}
          title="Mobile viewport"
        >
          <Smartphone className="h-4 w-4" />
        </button>
      </div>

      {/* Viewport Frame */}
      <div className="flex justify-center bg-zinc-950 border border-zinc-900 rounded-3xl p-6 overflow-hidden">
        <div
          className={`bg-zinc-950 transition-all duration-300 border border-zinc-900 p-6 md:p-8 rounded-2xl min-h-[500px] overflow-y-auto ${
            previewDevice === "mobile" ? "max-w-[375px] w-full" : "w-full"
          }`}
        >
          {coverImage && (
            <div className="w-full aspect-video relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-850 mb-6">
              <img src={coverImage} alt={title} className="object-cover w-full h-full" />
            </div>
          )}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 leading-tight">
            {title || "Untitled Draft"}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm italic border-l border-zinc-850 pl-3 mb-6">
            {excerpt || "Read full design parameters and software releases."}
          </p>
          <div
            className="prose prose-invert max-w-none prose-sm sm:prose-base prose-indigo"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editorContent) }}
          />
        </div>
      </div>
    </div>
  );
}

