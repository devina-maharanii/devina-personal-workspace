/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { Image, Copy, Search, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function VisionPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [analysisType, setAnalysisType] = useState("describe");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error("Please upload an image or enter a image URL.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "vision",
          payload: {
            analysisType,
            imageUrl,
          },
        }),
      });

      if (response.status === 402) {
        toast.error("Credits exhausted. Upgrade to continue.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to analyze image.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader.");

      let accum = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accum += chunk;
        setResult(accum);
      }
      toast.success("Image analyzed successfully!");
    } catch (_err) {
      toast.error("Error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Copied report content!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">AI Image Analysis</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Utilize Claude's vision capabilities to extract text, identify objects, and describe images.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Upload and controls card */}
        <form onSubmit={handleAnalyze} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
          {/* Paste URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-450 uppercase">Image URL</label>
            <input
              type="text"
              placeholder="Paste public image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Upload Button */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image className="h-4.5 w-4.5 text-zinc-550" />
              <div>
                <p className="text-xs font-bold text-zinc-300">Upload Image File</p>
                <p className="text-[10px] text-zinc-650">PNG, JPG, JPEG, or WEBP</p>
              </div>
            </div>
            <div className="scale-85 origin-right">
              <UploadButton
                endpoint="blogImage"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    setImageUrl(res[0].url);
                    toast.success("Image uploaded.");
                  }
                }}
                onUploadError={(err) => {
                  toast.error(`Upload error: ${err.message}`);
                }}
              />
            </div>
          </div>

          {/* Preview Image if URL exists */}
          {imageUrl && (
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/50 flex items-center justify-center relative select-none">
              <img src={imageUrl} alt="Analysis Preview" className="object-contain max-h-full max-w-full" />
            </div>
          )}

          {/* Analysis Type modifier */}
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-zinc-550 uppercase">Analysis Objective</label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-350 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="describe">Detailed Description</option>
              <option value="ocr">Extract Text (OCR)</option>
              <option value="objects">Object Identification</option>
              <option value="alt">Generate Alt Accessibility Text</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !imageUrl.trim()}
            className="flex h-11 items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-650 cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing pixels...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Execute Pixels Scan</span>
              </>
            )}
          </button>
        </form>

        {/* Output Panel Card */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4 shrink-0">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-zinc-400">Analysis results</h2>
            <button
              onClick={handleCopy}
              disabled={!result}
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              title="Copy details"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pt-4 text-xs sm:text-sm text-zinc-300 leading-relaxed prose prose-invert select-text">
            {result ? (
              <ReactMarkdown>{result}</ReactMarkdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 py-20 select-none space-y-2">
                <Image className="h-10 w-10 text-zinc-800 animate-pulse" />
                <p className="font-semibold">No Scan Run</p>
                <p className="text-xxs max-w-xs">Upload an asset, select a pixel modifier, and trigger scan execution.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
