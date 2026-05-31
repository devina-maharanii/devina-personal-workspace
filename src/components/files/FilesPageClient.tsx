/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Prisma } from "@prisma/client";
import {
  FolderOpen,
  Search,
  Grid,
  List,
  Copy,
  Download,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File as FileIcon,
  HardDrive,
  Loader2,
  Check,
  X
} from "lucide-react";
import { getFiles, getStorageUsed, deleteFile } from "@/lib/actions/files";
import { useFileStore } from "@/stores/fileStore";
import FileUploadButton from "./FileUploadButton";
import FilePreviewModal from "./FilePreviewModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { getErrorMessage } from "@/lib/utils";

interface FilesPageClientProps {
  orgId: string;
  plan: string;
}

type FileItem = Prisma.FileGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
      };
    };
  };
}>;

interface FilesResponse {
  files: FileItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const PLAN_LIMITS_BYTES: Record<string, number> = {
  FREE: 1 * 1024 * 1024 * 1024,        // 1 GB
  PRO: 10 * 1024 * 1024 * 1024,       // 10 GB
  ENTERPRISE: 100 * 1024 * 1024 * 1024 // 100 GB
};

export default function FilesPageClient({ orgId, plan }: FilesPageClientProps) {
  const { viewMode, setViewMode } = useFileStore();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
   
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  
  // 1. Fetch files list using SWR linked to Server Actions
  const { data, mutate, isLoading } = useSWR<FilesResponse>(
    ["files", orgId, query, activeTab, page],
    () => getFiles(orgId, { query, type: activeTab, page, limit: 12 }),
    { keepPreviousData: true }
  );

   
  const visibleFiles = data?.files?.filter((file) => !pendingDeletions.includes(file.id)) || [];

  // 2. Fetch storage usage sum
  const { data: storageUsed, mutate: mutateStorage } = useSWR(
    ["storage", orgId],
    () => getStorageUsed(orgId),
    { fallbackData: 0 }
  );

  const limitBytes = PLAN_LIMITS_BYTES[plan.toUpperCase()] || PLAN_LIMITS_BYTES.FREE;
  const storagePercentage = Math.min(Number(((storageUsed || 0) / limitBytes) * 100), 100);

  // Formatter helpers
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    const size = "h-5 w-5";
    if (mimeType.startsWith("image/")) return <ImageIcon className={`${size} text-indigo-400`} />;
    if (mimeType === "application/pdf") return <FileText className={`${size} text-red-400`} />;
    if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className={`${size} text-blue-400`} />;
    if (mimeType.includes("excel") || mimeType.includes("sheet")) return <FileSpreadsheet className={`${size} text-emerald-400`} />;
    if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("archive")) return <FileArchive className={`${size} text-amber-400`} />;
    if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("html") || mimeType.includes("css")) return <FileCode className={`${size} text-purple-400`} />;
    if (mimeType.startsWith("video/")) return <Video className={`${size} text-cyan-400`} />;
    if (mimeType.startsWith("audio/")) return <Music className={`${size} text-pink-400`} />;
    return <FileIcon className={`${size} text-zinc-400`} />;
  };

  // Actions
  const handleCopyLink = async (fileId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(fileId);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleDownload = (url: string, name: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    } catch {
      toast.error("Failed to trigger download.");
    }
  };

  const handleDelete = (fileId: string, fileName: string) => {
    // Optimistically hide the file and prepare for deletion after 4s
    setPendingDeletions(prev => [...prev, fileId]);
    setDeleteConfirmId(null);

    const timeoutId = setTimeout(async () => {
      startTransition(async () => {
        try {
          await deleteFile(fileId);
          mutate();
          mutateStorage();
          setPendingDeletions(prev => prev.filter(id => id !== fileId));
         
        } catch (err: unknown) {
          toast.error(getErrorMessage(err, `Failed to delete ${fileName}.`));
          // Revert optimistic deletion
          setPendingDeletions(prev => prev.filter(id => id !== fileId));
        }
      });
    }, 4000);

    toast.success(`Deleted ${fileName}`, {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          setPendingDeletions(prev => prev.filter(id => id !== fileId));
          toast.info("Deletion undone!");
        }
      }
    });
  };

  const handleUploadComplete = () => {
    mutate();
    mutateStorage();
  };

  const storageUsedColorClass = 
    storagePercentage > 90 
      ? "bg-rose-500 shadow-rose-500/25" 
      : storagePercentage > 70 
      ? "bg-amber-500 shadow-amber-500/25" 
      : "bg-emerald-500 shadow-emerald-500/25";

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Banner + Storage usage bar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-center p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
        <div className="xl:col-span-2 space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <FolderOpen className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Workspace Storage</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Upload, store, preview, and manage your team documents and assets in a consolidated drive.
          </p>
        </div>

        {/* Quota Progress widget */}
        <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-850 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-zinc-500" /> Storage Consumption
            </span>
            <span className="text-xxs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              {plan} Tier
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-white mb-1.5 font-medium">
              <span>{formatBytes(storageUsed || 0)} used</span>
              <span className="text-zinc-400">of {formatBytes(limitBytes)}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-800">
              <motion.div
                className={`h-full rounded-full shadow-lg ${storageUsedColorClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${storagePercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone at top */}
      <FileUploadButton
        endpoint="generalUpload"
        onUploadComplete={handleUploadComplete}
        maxSize="64MB"
      />

      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        {/* Left Side: Filter Tabs */}
        <div className="flex bg-zinc-950/60 p-1 border border-zinc-850 rounded-xl gap-1 overflow-x-auto w-fit">
          {["all", "images", "documents", "other"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Side: Search and View Mode */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search files by name..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-zinc-950/50 border border-zinc-850 hover:border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 transition-colors"
            />
          </div>

          <div className="flex border border-zinc-850 bg-zinc-950/50 p-1 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid View"
            >
              <Grid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="List View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Content Viewer */}
      {isLoading ? (
        viewMode === "grid" ? <GridSkeleton /> : <ListSkeleton />
      ) : !visibleFiles || visibleFiles.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No files found"
          description="There are no files matching your filters in this organization workspace. Drop some files to get started!"
        />
      ) : (
        <div className="space-y-6">
          {viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleFiles.map((file) => {
                const isImg = file.mimeType.startsWith("image/");
                return (
                  <motion.div
                    key={file.id}
                    layoutId={file.id}
                    className="group relative flex flex-col bg-zinc-900/30 hover:bg-zinc-900/70 border border-zinc-850 hover:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-64"
                  >
                    {/* Visual Preview Box */}
                    <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                      {isImg ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          {getFileIcon(file.mimeType)}
                        </div>
                      )}

                      {/* Quick Hover Overlays */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-xxs flex items-center justify-center gap-2 transition-all duration-300 z-10">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:scale-105 transition-all cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(file.id, file.url)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:scale-105 transition-all cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedId === file.id ? (
                            <Check className="h-4.5 w-4.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-4.5 w-4.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(file.url, file.name)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:scale-105 transition-all cursor-pointer"
                          title="Download"
                        >
                          <Download className="h-4.5 w-4.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(file.id)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 hover:scale-105 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-4 border-t border-zinc-850/60 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-between shrink-0">
                      <h3
                        className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </h3>
                      <div className="flex items-center justify-between text-xxs text-zinc-500 mt-1.5">
                        <span>{formatBytes(file.size)}</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Deletion Dialog Panel overlay */}
                    <AnimatePresence>
                      {deleteConfirmId === file.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4 text-center"
                        >
                          <Trash2 className="h-8 w-8 text-rose-500 mb-2 animate-bounce" />
                          <h4 className="text-xs font-bold text-white mb-1">Permanently Delete?</h4>
                          <p className="text-xxs text-zinc-500 mb-4 max-w-[80%] leading-normal">
                            This cannot be undone. The storage slot will be instantly freed.
                          </p>
                          <div className="flex gap-2 w-full max-w-[80%]">
                            <button
                              disabled={isPending}
                              onClick={() => handleDelete(file.id, file.name)}
                              className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xxs transition-colors flex items-center justify-center cursor-pointer"
                            >
                              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xxs border border-zinc-700/50 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW TABLE */
            <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-900/10 backdrop-blur-sm overflow-x-auto shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-950/55 text-xxs font-bold uppercase tracking-wider text-zinc-400">
                    <th className="py-4 px-6 sticky left-0 z-10 bg-zinc-950/55">Name</th>
                    <th className="py-4 px-4">Size</th>
                    <th className="py-4 px-4">Uploaded By</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/50 text-xs text-zinc-300">
                  {visibleFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-zinc-900/30 transition-colors group relative"
                    >
                      <td className="py-3.5 px-6 font-medium text-zinc-200 group-hover:text-white flex items-center gap-3 max-w-xs md:max-w-md truncate sticky left-0 z-10 bg-zinc-900/50 backdrop-blur-md">
                        <div className="p-2 bg-zinc-950 border border-zinc-850 rounded-lg shrink-0">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <span className="truncate" title={file.name}>
                          {file.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-zinc-400">
                        {formatBytes(file.size)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 truncate max-w-[150px]" title={file.user?.email}>
                        {file.user?.name || file.user?.email || "System"}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700/50 cursor-pointer"
                            title="Preview"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(file.id, file.url)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700/50 cursor-pointer"
                            title="Copy Link"
                          >
                            {copiedId === file.id ? (
                              <Check className="h-4.5 w-4.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-4.5 w-4.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownload(file.url, file.name)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700/50 cursor-pointer"
                            title="Download"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </button>

                          {deleteConfirmId === file.id ? (
                            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 z-10 shrink-0">
                              <button
                                disabled={isPending}
                                onClick={() => handleDelete(file.id, file.name)}
                                className="p-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-colors cursor-pointer"
                                title="Confirm Delete"
                              >
                                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                disabled={isPending}
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                title="Cancel Delete"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(file.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700/50 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {data?.totalPages && data.totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t border-zinc-850/60 mt-4">
              <span className="text-xs text-zinc-500 font-medium">
                Showing page {data?.currentPage} of {data?.totalPages} ({data?.totalCount} total assets)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white disabled:opacity-40 disabled:hover:text-zinc-300 disabled:pointer-events-none transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, data?.totalPages || 1))}
                  disabled={page === data?.totalPages}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white disabled:opacity-40 disabled:hover:text-zinc-300 disabled:pointer-events-none transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal Canvas */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}

// Visual Pulse Loaders Skeletons
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col bg-zinc-900/20 border border-zinc-850 rounded-2xl h-64 overflow-hidden animate-pulse"
        >
          <div className="flex-1 bg-zinc-950" />
          <div className="p-4 border-t border-zinc-850/60 space-y-2">
            <div className="h-3 w-2/3 bg-zinc-800 rounded-full" />
            <div className="flex justify-between items-center">
              <div className="h-2 w-1/4 bg-zinc-800 rounded-full" />
              <div className="h-2 w-1/5 bg-zinc-800 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-900/10 animate-pulse">
      <div className="h-10 bg-zinc-950/50 border-b border-zinc-850" />
      <div className="divide-y divide-zinc-850/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex p-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 rounded-lg" />
              <div className="h-3.5 w-48 bg-zinc-800 rounded-full" />
            </div>
            <div className="h-3 w-16 bg-zinc-800 rounded-full" />
            <div className="h-3 w-24 bg-zinc-800 rounded-full" />
            <div className="h-3 w-20 bg-zinc-800 rounded-full" />
            <div className="h-6 w-24 bg-zinc-900 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
