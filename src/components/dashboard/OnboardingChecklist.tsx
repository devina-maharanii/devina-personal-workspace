"use client";

import { useState, useTransition } from "react";
import { completeOnboardingAction } from "@/lib/actions/dashboard";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface OnboardingItem {
  id: string;
  label: string;
  desc: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  orgId: string;
  items: OnboardingItem[];
}

export default function OnboardingChecklist({ orgId, items }: OnboardingChecklistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const handleDismiss = () => {
    startTransition(async () => {
      try {
        await completeOnboardingAction(orgId);
        setHidden(true);
        toast.success("Onboarding checklist dismissed.");
      } catch (_err) {
        toast.error("Failed to dismiss onboarding checklist.");
      }
    });
  };

  if (hidden) return null;

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-zinc-900/40 to-zinc-900/30 overflow-hidden shadow-xl shadow-indigo-950/5 relative">
      {/* Top Banner Indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Header bar */}
      <div className="flex items-center justify-between p-5 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Getting Started Checklist</h2>
            <p className="text-xxs text-indigo-300 font-semibold mt-0.5">
              {completedCount} of {items.length} tasks completed ({progressPercent}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={isOpen ? "Collapse checklist" : "Expand checklist"}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Dismiss checklist"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress slider */}
      <div className="px-5 pb-3">
        <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-900/50">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Collapsible checklist body */}
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-zinc-900/50 divide-y divide-zinc-900/30 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3.5 pt-3 first:pt-0 transition-opacity duration-300 ${
                item.completed ? "opacity-60" : ""
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 fill-indigo-500/10" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-zinc-600" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3
                  className={`text-xs font-bold ${
                    item.completed ? "line-through text-zinc-500" : "text-zinc-200"
                  }`}
                >
                  {item.label}
                </h3>
                <p className="text-[11px] text-zinc-550 leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
