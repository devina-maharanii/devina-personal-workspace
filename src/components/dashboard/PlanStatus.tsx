"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CreditCard, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

export interface QuotaUsage {
  used: number;
  limit: number;
  label: string;
  unit?: string;
}

interface PlanStatusProps {
  planName: string;
  renewalDate: string | Date | null;
  usages: QuotaUsage[];
  isFreePlan: boolean;
}

export default function PlanStatus({ planName, renewalDate, usages, isFreePlan }: PlanStatusProps) {
  const formattedDate = renewalDate
    ? format(typeof renewalDate === "string" ? parseISO(renewalDate) : renewalDate, "MMMM dd, yyyy")
    : null;

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6 flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Title and Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-white">Plan Quota Limits</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Active workspace resources and renewal status.
            </p>
          </div>
          <span className={`px-2.5 py-1 text-xxs font-bold uppercase rounded-lg tracking-wider border ${
            isFreePlan
              ? "bg-zinc-950 border-zinc-800 text-zinc-400"
              : "bg-indigo-600/10 border-indigo-500/20 text-indigo-400"
          }`}>
            {planName} Plan
          </span>
        </div>

        {/* Usages meters */}
        <div className="space-y-4">
          {usages.map((quota) => {
            const percentage = Math.min((quota.used / (quota.limit || 1)) * 100, 100);
            return (
              <div key={quota.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">{quota.label}</span>
                  <span className="text-zinc-200">
                    {quota.used.toLocaleString()}
                    {quota.unit} / {quota.limit.toLocaleString()}
                    {quota.unit}
                  </span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-900/50 overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage > 90
                        ? "bg-gradient-to-r from-red-500 to-amber-500"
                        : percentage > 75
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                        : "bg-gradient-to-r from-indigo-500 to-purple-500"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription renewals and Upgrade actions */}
      <div className="pt-6 border-t border-zinc-900 mt-6 space-y-4">
        {formattedDate ? (
          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <CreditCard className="h-4 w-4 text-zinc-500 shrink-0" />
            <span>
              Next billing cycle renews on <strong className="text-zinc-200">{formattedDate}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-zinc-500">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>No recurring subscription. Limits do not refresh.</span>
          </div>
        )}

        {isFreePlan ? (
          <Link
            href="/pricing"
            className="flex h-10 items-center justify-center gap-1.5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/15"
          >
            <span>Upgrade Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <div className="flex h-10 items-center justify-center gap-1.5 w-full rounded-xl bg-zinc-950 border border-zinc-850 text-xs font-bold text-zinc-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Premium Plan Active</span>
          </div>
        )}
      </div>
    </div>
  );
}
