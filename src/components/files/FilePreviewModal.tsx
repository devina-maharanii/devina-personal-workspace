"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, FileText, Image as ImageIcon, Video, Music, FileSpreadsheet, FileArchive, FileCode, File as FileIcon, ExternalLink } from "lucide-react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    url: string;
    mimeType: string;
    size: number;
  } | null;
}

export default function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");

  // File size formatter helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-16 w-16 text-indigo-400" />;
    if (mimeType === "application/pdf") return <FileText className="h-16 w-16 text-red-400" />;
    if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="h-16 w-16 text-blue-400" />;
    if (mimeType.includes("excel") || mimeType.includes("sheet")) return <FileSpreadsheet className="h-16 w-16 text-emerald-400" />;
    if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("archive")) return <FileArchive className="h-16 w-16 text-amber-400" />;
    if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("html") || mimeType.includes("css")) return <FileCode className="h-16 w-16 text-purple-400" />;
    if (mimeType.startsWith("video/")) return <Video className="h-16 w-16 text-cyan-400" />;
    if (mimeType.startsWith("audio/")) return <Music className="h-16 w-16 text-pink-400" />;
    return <FileIcon className="h-16 w-16 text-zinc-400" />;
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 select-none">
          {/* Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
          />

          {/* Modal Content container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-5xl h-[80vh] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/30">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base font-semibold text-white truncate" title={file.name}>
                  {file.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  {formatBytes(file.size)} • {file.mimeType}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isImage && (
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4.5 w-4.5" />
                    </button>
                    <span
                      onClick={handleResetZoom}
                      className="text-xs text-zinc-400 px-2 font-mono font-medium cursor-pointer hover:text-white"
                      title="Reset Zoom"
                    >
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}

                <a
                  href={file.url}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 bg-zinc-900/50 transition-colors flex items-center justify-center"
                  title="Download File"
                >
                  <Download className="h-4.5 w-4.5" />
                </a>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 bg-zinc-900/50 transition-colors flex items-center justify-center"
                  title="Close Preview"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Preview Canvas */}
            <div className="flex-1 overflow-auto bg-zinc-950 flex items-center justify-center p-6">
              {isImage ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-auto max-w-full max-h-full">
                  <motion.img
                    src={file.url}
                    alt={file.name}
                    animate={{ scale: zoom }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md cursor-grab active:cursor-grabbing origin-center select-none"
                    draggable={false}
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={`${file.url}#toolbar=0`}
                  title={file.name}
                  className="w-full h-full rounded-2xl border border-zinc-800 shadow-inner bg-zinc-900"
                />
              ) : isVideo ? (
                <video
                  src={file.url}
                  controls
                  className="w-full h-full max-h-[60vh] rounded-2xl border border-zinc-800 shadow-md object-contain bg-black"
                />
              ) : isAudio ? (
                <div className="flex flex-col items-center justify-center gap-6 p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 max-w-md w-full">
                  {getFileIcon(file.mimeType)}
                  <audio src={file.url} controls className="w-full" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm rounded-3xl max-w-md w-full gap-5">
                  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-inner">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white font-medium text-sm break-all">{file.name}</h4>
                    <p className="text-zinc-500 text-xs">{formatBytes(file.size)}</p>
                  </div>
                  <div className="flex flex-col gap-2.5 w-full mt-2">
                    <a
                      href={file.url}
                      download={file.name}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Download File
                    </a>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" /> Open in New Tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
