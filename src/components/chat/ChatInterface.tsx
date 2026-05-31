/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import ReactMarkdown from "react-markdown";
import { Copy, Bot } from "lucide-react";
import { toast } from "sonner";
import type { Components } from "react-markdown";
import type { HLJSApi } from "highlight.js";

interface ChatInterfaceProps {
  userAvatar?: string | null;
}

export default function ChatInterface({ userAvatar }: ChatInterfaceProps) {
  const { messages, isStreaming, activeConversationId } = useChatStore();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on messages shift
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied response text!");
  };

  // Lazy-load highlight.js and run it only when code matches
   
  const [hljsCore, setHljsCore] = useState<HLJSApi | null>(null);

  useEffect(() => {
    // Lazily load highlight.js if a code block is rendered
    let isMounted = true;
    const loadHljs = async () => {
      try {
        const hljsModule = (await import("highlight.js")).default as HLJSApi;
        await import("highlight.js/styles/github-dark.css");
        if (isMounted) setHljsCore(hljsModule);
      } catch (e) {
        console.error("Failed to load highlight.js", e);
      }
    };
    // Since we don't know initially if messages have code, we load it proactively 
    // but asynchronously so it doesn't block the main UI render
    loadHljs();
    return () => { isMounted = false; };
  }, []);

  // Markdown Code renderer utilizing highlight.js
  const renderMarkdownCode: Components["code"] = ({ node: _node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeText = String(children ?? "").replace(/\n$/, "");

    if (match) {
      let highlighted = codeText; // fallback
      try {
        if (hljsCore) {
          highlighted = hljsCore.highlight(codeText, { language: match[1] }).value;
        }
      } catch (_err) {
        // Fallback if highlight fails
      }

      return (
        <div className="relative group my-4">
          <button
            onClick={() => handleCopy(codeText)}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white text-zinc-400"
            title="Copy code"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 border border-zinc-900/60">
            <code
              className="text-xs font-mono leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    }

    return (
      <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-xs font-mono text-pink-400" {...props}>
        {children}
      </code>
    );
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/20">
          <Bot className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">AI Sandbox Workspace</h2>
          <p className="text-xs text-zinc-500 max-w-sm leading-normal">
            Start a new thread or select an existing one to invoke advanced Claude models.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {/* AI Avatar */}
            {!isUser && (
              <div className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-indigo-400 shrink-0 select-none">
                <Bot className="h-4.5 w-4.5" />
              </div>
            )}

            <div className="space-y-1 max-w-[85%] sm:max-w-[70%] min-w-0">
              {/* Message Bubble Container */}
              <div
                className={`relative group p-4 rounded-2xl border transition-all ${
                  isUser
                    ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-300 rounded-tl-none"
                }`}
              >
                {/* Copy helper on bubble hover (AI responses) */}
                {!isUser && msg.content && (
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="absolute -right-3 -top-3 p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white text-zinc-400 shadow-lg"
                    title="Copy message"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}

                {/* Content parsing */}
                <div className="text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none">
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        code: renderMarkdownCode,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* UploadThing file reference link if exists */}
                {msg.fileUrl && (
                  <div className="mt-3 pt-3 border-t border-indigo-500/30">
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xxs font-bold uppercase tracking-wider text-indigo-200 hover:text-white underline"
                    >
                      View uploaded asset file
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="shrink-0 select-none">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="User"
                    className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    U
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Live response loading/streaming bounce dots indicator */}
      {isStreaming && messages[messages.length - 1]?.content === "" && (
        <div className="flex items-start gap-4">
          <div className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-indigo-400 shrink-0">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-300 rounded-tl-none flex items-center gap-1.5 py-3 h-10 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
