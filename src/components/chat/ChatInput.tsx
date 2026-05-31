/* eslint-disable @next/next/no-img-element */
 
"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";
import { Send, Paperclip, X, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string, model: string, fileUrl?: string | null) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const CHAT_MODELS = [
  { id: "claude-sonnet-4-20250514", label: "Claude 3.5 Sonnet (Default)", speed: "Fast", desc: "Balanced intelligence & speed." },
  { id: "claude-opus-4-5", label: "Claude 3 Opus (Premium)", speed: "Standard", desc: "Best for complex reasoning & logic." },
  { id: "claude-haiku-4-5-20251001", label: "Claude 3.5 Haiku (Eco)", speed: "Instant", desc: "Super lightweight & quick responses." },
];

export default function ChatInput({
  onSend,
  selectedModel,
  setSelectedModel,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const searchParams = useSearchParams();

  // Prefill prompt input from prompt library query params
  useEffect(() => {
    const prefillPrompt = searchParams.get("prompt");
    if (prefillPrompt) {
      setText(prefillPrompt);
      // Clean query parameter from address bar
      const newUrl = window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchParams]);

  // Auto-resize textarea logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, 150)}px`;
  }, [text]);

  const handleSend = () => {
    if ((!text.trim() && !fileUrl) || isStreaming || isUploading || disabled) return;
    onSend(text, selectedModel, fileUrl);
    setText("");
    setFileUrl(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Approximate tokens count
  const charCount = text.length;
  const tokenCount = Math.round(charCount / 4);

  return (
    <div className="p-4 border-t border-zinc-900 bg-zinc-950 space-y-4">
      {/* File attachment thumbnail preview */}
      {fileUrl && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 w-fit gap-4 pr-3 relative">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded bg-zinc-950 border border-zinc-850 overflow-hidden flex items-center justify-center shrink-0">
              <img src={fileUrl} alt="Attached asset preview" className="object-cover h-full w-full" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Attachment</p>
              <p className="text-[11px] text-zinc-300 truncate max-w-[150px]">Uploaded Image file</p>
            </div>
          </div>
          <button
            onClick={() => setFileUrl(null)}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input controls strip */}
      <div className="flex items-end gap-3">
        {/* Model dropdown + Textarea card */}
        <div className="flex-1 flex flex-col rounded-2xl border border-zinc-850 bg-zinc-900/40 focus-within:border-zinc-800 transition-colors overflow-hidden">
          {/* Top selection bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900/50 bg-zinc-950/20 select-none">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs font-bold text-zinc-350 bg-transparent focus:outline-none cursor-pointer hover:text-white transition-colors"
            >
              {CHAT_MODELS.map((model) => (
                <option key={model.id} value={model.id} className="bg-zinc-950 text-zinc-300">
                  {model.label} ({model.speed})
                </option>
              ))}
            </select>

            <span className="text-[10px] font-bold text-zinc-600">
              {charCount} chars / ~{tokenCount} tokens
            </span>
          </div>

          {/* Prompt input text container */}
          <div className="flex items-center p-3 gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message here (Shift+Enter for newline)..."
              className="flex-grow bg-transparent text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none max-h-36 py-1 leading-normal"
              disabled={isStreaming || disabled}
            />

            {/* Custom styled UploadThing wrapper */}
            <div className="relative shrink-0 flex items-center select-none scale-85 origin-right">
              {isUploading ? (
                <div className="h-8 w-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-950">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                </div>
              ) : (
                <UploadButton
                  endpoint="blogImage"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res) => {
                    setIsUploading(false);
                    if (res?.[0]) {
                      setFileUrl(res[0].url);
                    }
                  }}
                  onUploadError={(err) => {
                    setIsUploading(false);
                    alert(`Upload failed: ${err.message}`);
                  }}
                  appearance={{
                    button: "h-8 w-8 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer px-0 py-0 after:content-none",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: <Paperclip className="h-4 w-4 shrink-0" />,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Send Action */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !fileUrl) || isStreaming || isUploading || disabled}
          className="h-11 w-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-650 flex items-center justify-center text-white transition-all active:scale-[0.98] shrink-0 cursor-pointer shadow-lg shadow-indigo-600/10"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
