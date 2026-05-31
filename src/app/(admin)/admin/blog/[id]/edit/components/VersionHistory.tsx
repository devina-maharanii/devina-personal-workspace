"use client";

import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BlogPostVersion } from "@prisma/client";

type BlogPostVersionSerializable = Omit<BlogPostVersion, "createdAt"> & {
  createdAt: string | Date;
};

interface VersionHistoryProps {
  versions: BlogPostVersionSerializable[];
  handleRevert: (versionId: string) => void;
}

export default function VersionHistory({ versions, handleRevert }: VersionHistoryProps) {
  return (
    <div className="border border-zinc-900 bg-zinc-900/10 p-6 rounded-2xl space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white">Save History (Last 5 Saves)</h3>
        <p className="text-[11px] text-zinc-500">
          Select and restore any previous version of this draft instantly.
        </p>
      </div>

      <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
        {versions.length === 0 ? (
          <p className="p-8 text-center text-xs text-zinc-500">No versions tracked yet.</p>
        ) : (
          versions.map((ver, idx) => (
            <div
              key={ver.id}
              className="p-4 bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {ver.title || "Untitled Draft"}
                  </span>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                    v{versions.length - idx}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Saved {formatDistanceToNow(new Date(ver.createdAt))} ago (
                  {new Date(ver.createdAt).toLocaleTimeString()})
                </p>
              </div>

              <button
                onClick={() => handleRevert(ver.id)}
                className="px-3 py-1.5 rounded-lg border border-zinc-850 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-850 text-[10px] font-bold text-indigo-400 hover:text-indigo-350 cursor-pointer"
              >
                Restore Draft
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
