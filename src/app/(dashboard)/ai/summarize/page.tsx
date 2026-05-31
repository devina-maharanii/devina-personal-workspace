"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { FileText, Copy, Download, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function SummarizerPage() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState("Brief (3 bullets)");
  const [length, setLength] = useState("Medium (300w)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !fileUrl) {
      toast.error("Please enter text or upload a document file.");
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
          tool: "summarize",
          payload: {
            text: text || `Summarize uploaded file: ${fileUrl}`,
            style,
            length,
          },
        }),
      });

      if (response.status === 402) {
        toast.error("Insufficient credit quota. Please upgrade your plan.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to process summary.");
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
      toast.success("Document summarized successfully!");
    } catch (_err) {
      toast.error("Error occurred during summarization.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Summary copied to clipboard!");
  };

  const handleDownload = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "summary.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded summary file.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">AI Document Summarizer</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Distill lengthy reports, whitepapers, or transcripts into key points.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Input Panel Card */}
        <form onSubmit={handleSummarize} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Document Content</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste raw text or type contents here..."
              rows={8}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs sm:text-sm text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
            />
          </div>

          {/* Document Upload Button Option */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-zinc-550" />
              <div>
                <p className="text-xs font-bold text-zinc-300">Upload Reference File</p>
                <p className="text-[10px] text-zinc-650">PDF, TXT, MD, or Image files</p>
              </div>
            </div>
            <div className="scale-85 origin-right">
              <UploadButton
                endpoint="blogImage"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    setFileUrl(res[0].url);
                    toast.success("File uploaded successfully.");
                  }
                }}
                onUploadError={(err) => {
                  toast.error(`Upload error: ${err.message}`);
                }}
              />
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-zinc-550 uppercase">Summary Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Brief (3 bullets)">Brief (3 bullets)</option>
                <option value="Detailed">Detailed Summary</option>
                <option value="Executive Summary">Executive Narrative</option>
                <option value="Q&A format">Q&A Outline</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-zinc-550 uppercase">Output Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Short (100w)">Short (~100 words)</option>
                <option value="Medium (300w)">Medium (~300 words)</option>
                <option value="Long (500w)">Long (~500 words)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!text.trim() && !fileUrl)}
            className="flex h-11 items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-650 cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Summarizing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </form>

        {/* Output Panel Card */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4 shrink-0">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-zinc-400">Summary Results</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!result}
                className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                title="Copy text"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownload}
                disabled={!result}
                className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                title="Download text file"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pt-4 text-xs sm:text-sm text-zinc-300 leading-relaxed prose prose-invert select-text">
            {result ? (
              <ReactMarkdown>{result}</ReactMarkdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 py-20 select-none space-y-2">
                <FileText className="h-10 w-10 text-zinc-800 animate-pulse" />
                <p className="font-semibold">No Summary Available</p>
                <p className="text-xxs max-w-xs">Fill options on the left and trigger generation to output markdown summaries here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
