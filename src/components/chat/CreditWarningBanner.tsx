"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

interface CreditWarningBannerProps {
  usedCredits: number;
  maxCredits: number;
}

export default function CreditWarningBanner({ usedCredits, maxCredits }: CreditWarningBannerProps) {
  const remaining = maxCredits - usedCredits;
  const ratio = remaining / (maxCredits || 1);

  // Show banner if remaining credits is less than 10% but still above 0
  const isLow = ratio < 0.1 && remaining > 0;

  if (!isLow) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 select-none animate-pulse">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-xs text-amber-200">
          Warning: Low credit balance! Only <strong className="text-white">{remaining}</strong> credits remaining of {maxCredits}.
        </span>
      </div>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 text-xxs font-bold uppercase tracking-wider text-amber-400 hover:text-white transition-colors"
      >
        <span>Add credits</span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
