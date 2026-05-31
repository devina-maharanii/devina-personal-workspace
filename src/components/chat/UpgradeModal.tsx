/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight, X } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-900 p-6 space-y-6 relative shadow-2xl shadow-red-950/10">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">AI Credits Exhausted</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Your organization's model prompt limit has been fully utilized. Increase limits to resume using the sandbox.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/pricing"
            className="flex h-11 items-center justify-center gap-1.5 w-full rounded-xl bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/10"
          >
            <span>Upgrade Plan Tier</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={onClose}
            className="h-11 w-full rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-bold text-zinc-400 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
