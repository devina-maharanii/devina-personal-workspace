 
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface PromptItem {
  id: string;
  title: string;
  category: string;
  prompt: string;
  isCustom?: boolean;
}

const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: "1",
    title: "SQL Schema Generator",
    category: "Coding",
    prompt: "Create a PostgreSQL schema for a SaaS workspace that includes organizations, memberships, invitations, and billing tokens. Enable constraints and proper cascade index maps.",
  },
  {
    id: "2",
    title: "SEO Copywriting Review",
    category: "Copywriting",
    prompt: "Analyze the following blog post copy for SEO compatibility. Check for heading layout levels, keyword density, and provide three optimized alternatives for the title and description.",
  },
  {
    id: "3",
    title: "Email Outreach Composition",
    category: "Marketing",
    prompt: "Write a high-converting cold email template pitch targeted at CTOs for a developers automation platform. Keep it brief (under 150 words) with a clear, single call to action.",
  },
  {
    id: "4",
    title: "Feature Landing Spec",
    category: "Marketing",
    prompt: "Act as an expert product marketer. Write a detailed landing page feature breakdown section for a new visual CSS builder including title tags, bullet points, and pricing comparisons.",
  },
  {
    id: "5",
    title: "Code Refactor Optimizer",
    category: "Coding",
    prompt: "Refactor this React TypeScript component to optimize performance (e.g. useMemo, useCallback) and ensure proper accessibility rules (ARIA tags, target sizes).",
  },
];

export default function PromptsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [prompts, setPrompts] = useState<PromptItem[]>(DEFAULT_PROMPTS);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Coding");
  const [newPromptText, setNewPromptText] = useState("");

  // Load custom prompts from browser storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("custom_prompts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPrompts([...DEFAULT_PROMPTS, ...parsed]);
      } catch (_err) {
        // fail silent
      }
    }
  }, []);

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) {
      toast.error("Please fill in prompt title and prompt text.");
      return;
    }

    const newPrompt: PromptItem = {
      id: crypto.randomUUID(),
      title: newTitle,
      category: newCategory,
      prompt: newPromptText,
      isCustom: true,
    };

    const updatedCustom = prompts.filter((p) => p.isCustom);
    const nextCustom = [...updatedCustom, newPrompt];
    localStorage.setItem("custom_prompts", JSON.stringify(nextCustom));

    setPrompts([...DEFAULT_PROMPTS, ...nextCustom]);
    setNewTitle("");
    setNewPromptText("");
    toast.success("Custom prompt saved successfully!");
  };

  const handleDeletePrompt = (id: string) => {
    const updatedCustom = prompts.filter((p) => p.isCustom && p.id !== id);
    localStorage.setItem("custom_prompts", JSON.stringify(updatedCustom));
    setPrompts([...DEFAULT_PROMPTS, ...updatedCustom]);
    toast.success("Custom prompt deleted.");
  };

  const handleUsePrompt = (promptText: string) => {
    router.push(`/ai?prompt=${encodeURIComponent(promptText)}`);
  };

  const categories = ["All", "Coding", "Copywriting", "Marketing"];

  const filteredPrompts = prompts.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Prompt Library</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Explore curated prompts or design custom instructions to inject directly into your chat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Prompts Deck (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Tabs */}
          <div className="flex gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-900 w-fit select-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10"
                    : "text-zinc-550 hover:text-zinc-350"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPrompts.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-750 transition-all duration-300 relative h-60"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-500/10 border border-indigo-500/10 text-indigo-400">
                      {p.category}
                    </span>
                    {p.isCustom && (
                      <button
                        onClick={() => handleDeletePrompt(p.id)}
                        className="p-1 rounded text-zinc-650 hover:text-red-400 hover:bg-zinc-850 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete prompt"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-normal line-clamp-4 select-text">
                    {p.prompt}
                  </p>
                </div>

                <button
                  onClick={() => handleUsePrompt(p.prompt)}
                  className="flex h-9 items-center justify-center gap-1 w-full rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer mt-4"
                >
                  <span>Use This Prompt</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Prompt Form (1/3 width) */}
        <form
          onSubmit={handleCreatePrompt}
          className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-5"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-indigo-400" />
            <h2 className="font-bold text-sm text-white">Create Custom Prompt</h2>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-550">Prompt Title</label>
              <input
                type="text"
                placeholder="e.g. SVG Logo Composer"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-550">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-350 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Coding">Coding</option>
                <option value="Copywriting">Copywriting</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {/* Instruction content */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-550">Prompt Text</label>
              <textarea
                placeholder="Type instructions here..."
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex h-10 items-center justify-center gap-1.5 w-full rounded-xl bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Save Instruction</span>
          </button>
        </form>
      </div>
    </div>
  );
}
