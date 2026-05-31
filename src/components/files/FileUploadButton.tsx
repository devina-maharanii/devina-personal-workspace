"use client";

import { useCallback, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { UploadCloud, File, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage } from "@/lib/utils";

interface FileUploadButtonProps {
  endpoint: "avatarUpload" | "coverImageUpload" | "documentUpload" | "generalUpload";
   
  onUploadComplete: (res: unknown) => void;
  accept?: string;
  maxSize?: string;
}

export default function FileUploadButton({
  endpoint,
  onUploadComplete,
  accept = "*",
  maxSize
}: FileUploadButtonProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      setUploadProgress(0);
      toast.success("File uploaded successfully!");
      if (onUploadComplete) {
        onUploadComplete(res);
      }
    },
    onUploadError: (err) => {
      setUploadProgress(0);
      toast.error(getErrorMessage(err, "Upload failed. Please check storage limits or file size."));
      console.error(err);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    }
  });

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      try {
        await startUpload(files);
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Something went wrong."));
      }
    },
    [startUpload]
  );

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length === 0) return;

      try {
        await startUpload(files);
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Something went wrong."));
      }
    },
    [startUpload]
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative w-full rounded-2xl border border-dashed transition-all duration-300 ${
        isDragActive
          ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/10"
          : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700 hover:bg-zinc-900/10"
      } p-8 flex flex-col items-center justify-center text-center cursor-pointer`}
    >
      <input
        type="file"
        id="file-upload-input"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
        onChange={onFileChange}
        accept={accept}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        {isUploading ? (
          <div className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center animate-pulse">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className={`p-4 rounded-full border transition-all duration-300 ${
            isDragActive 
              ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" 
              : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
          }`}>
            <UploadCloud className="h-8 w-8" />
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-200">
            {isUploading ? "Uploading file..." : "Drag & drop your files here, or click to browse"}
          </p>
          <p className="text-xs text-zinc-500">
            {maxSize ? `Supports uploads up to ${maxSize}` : "Upload your documents, images, and other assets"}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 right-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-xl p-3 shadow-lg flex items-center gap-3 z-10"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <File className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-zinc-400 font-medium truncate">Processing file upload</span>
                <span className="text-indigo-400 font-bold">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
