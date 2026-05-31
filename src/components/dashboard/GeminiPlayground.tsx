"use client";

import { useState } from "react";
import { Terminal, Loader2 } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

export default function GeminiPlayground() {
  const { addNotification } = useUIStore();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI content");
      }

      setResult(data.text);
      addNotification({
        title: "Generation Successful",
        message: "AI text generated and synchronized successfully.",
        type: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      addNotification({
        title: "API Error",
        message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
      <div className="flex items-center gap-2">
        <Terminal className="h-4.5 w-4.5 text-indigo-400" />
        <h2 className="font-semibold text-lg text-white">Gemini Playground</h2>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type a creative prompt (e.g. Write a tagline for an AI analytics dashboard)"
            rows={3}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white transition-all hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            "Send Request"
          )}
        </button>
      </form>

      {/* Result Area */}
      {result && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
