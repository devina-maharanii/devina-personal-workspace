"use client";

import { motion } from "framer-motion";
import { FADE_IN } from "@/lib/animations";

export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <motion.div
      variants={FADE_IN}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-850 bg-zinc-950/30 ${className}`}
    >
      <div className="h-12 w-12 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-zinc-200 mb-1.5">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </motion.div>
  );
}
