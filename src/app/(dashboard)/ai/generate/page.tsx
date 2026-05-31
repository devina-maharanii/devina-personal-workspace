"use client";

import { useState } from "react";
import { createDraftBlogPostAction } from "@/lib/actions/chat";
import { FileText, Copy, Save, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function GeneratorPage() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState("Blog post");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  const languages = [
    "English", "Spanish", "French", "German", "Italian",
    "Portuguese", "Chinese", "Japanese", "Korean", "Hindi"
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic or copy instructions.");
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
          tool: "generate",
          payload: {
            template,
            tone,
            language,
            topic,
          },
        }),
      });

      if (response.status === 402) {
        toast.error("Insufficient credits. Upgrade your account.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate content.");
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
      // Populate default draft title based on topic snippet
      setDraftTitle(`AI Draft - ${topic.slice(0, 30)}`);
      toast.success("Content generated successfully!");
    } catch (_err) {
      toast.error("Error occurred during content generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!result.trim()) return;
    setSavingDraft(true);
    try {
      await createDraftBlogPostAction(draftTitle || "AI Content Draft", result);
      toast.success("Saved successfully as CMS draft blog post!");
    } catch (_err) {
      toast.error("Failed to save draft blog post.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Content copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">AI Content Generator</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Generate blog posts, social threads, email templates, and copies instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Copy Configuration Card */}
        <form onSubmit={handleGenerate} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Topic & Scope instructions</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Write a persuasive email newsletter explaining our new Next.js 16 analytics features..."
              rows={6}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs sm:text-sm text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Template selection */}
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-zinc-550 uppercase">Template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Blog post">Blog Post Article</option>
                  <option value="LinkedIn post">LinkedIn Story</option>
                  <option value="Twitter thread">Twitter / X Thread</option>
                  <option value="Email newsletter">Marketing Email</option>
                  <option value="Product description">Product Copy</option>
                </select>
              </div>

              {/* Tone selection */}
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-zinc-550 uppercase">Tone Style</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Professional">Professional</option>
                  <option value="Casual">Casual & Fun</option>
                  <option value="Persuasive">Persuasive</option>
                  <option value="Technical">Technical & Deep</option>
                </select>
              </div>

              {/* Language selection */}
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-zinc-550 uppercase">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="flex h-11 items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-650 cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Writing content...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Compose Content</span>
              </>
            )}
          </button>
        </form>

        {/* Output Panel Card with Inline Editor */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col h-[560px]">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4 shrink-0">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-zinc-400">Editor workspace</h2>
            <button
              onClick={handleCopy}
              disabled={!result}
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              title="Copy all text"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          {result ? (
            <div className="flex-grow flex flex-col space-y-4 pt-4 min-h-0">
              {/* Draft post titles input wrapper */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-550">Draft Title</label>
                <input
                  type="text"
                  placeholder="Enter draft title..."
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Editor Workspace Textarea */}
              <div className="flex-grow flex flex-col space-y-1 min-h-0">
                <label className="text-[10px] uppercase font-bold text-zinc-550">Generated Rich Text</label>
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full flex-grow rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 overflow-y-auto leading-relaxed resize-none"
                />
              </div>

              {/* Save Draft Action */}
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft || !result.trim()}
                className="flex h-10 items-center justify-center gap-1.5 w-full rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingDraft ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Save to CMS blog posts</span>
              </button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-zinc-600 py-20 select-none space-y-2">
              <FileText className="h-10 w-10 text-zinc-800 animate-pulse" />
              <p className="font-semibold">No Content Generated</p>
              <p className="text-xxs max-w-xs">Define prompts on the left to write inline-editable draft articles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
