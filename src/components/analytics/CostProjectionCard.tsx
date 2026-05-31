"use client";

import { AlertCircle, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

export interface CostProjection {
  mtdSpend: number;
  projectedSpend: number;
  budget: number;
  plan: string;
}

interface CostProjectionCardProps {
  projection: CostProjection;
}

export default function CostProjectionCard({ projection }: CostProjectionCardProps) {
  const { mtdSpend, projectedSpend, budget, plan } = projection;

  const pctActual = budget > 0 ? Math.min(100, Math.round((mtdSpend / budget) * 100)) : 0;
  const pctProjected = budget > 0 ? Math.min(200, Math.round((projectedSpend / budget) * 100)) : 0;

  // SVG circular progress parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  // Cap SVG offset progress calculation at 1 (100%)
  const svgProgress = Math.min(1, projectedSpend / (budget || 1));
  const strokeOffset = circumference - svgProgress * circumference;

  // Color alerts selector
  let statusColor = "stroke-emerald-500 text-emerald-400";
  let alertBg = "bg-emerald-500/5 border-emerald-500/10 text-emerald-300";
  let alertIcon = Sparkles;
  let alertMessage = "Spending is highly optimal. Your projected totals remain well below limits.";

  if (projectedSpend >= budget * 0.85) {
    statusColor = "stroke-rose-500 text-rose-400";
    alertBg = "bg-rose-500/5 border-rose-500/15 text-rose-300 animate-pulse";
    alertIcon = ShieldAlert;
    alertMessage = "Critical limit alert: month-end projections are set to exceed budget capacities!";
  } else if (projectedSpend >= budget * 0.5) {
    statusColor = "stroke-amber-500 text-amber-400";
    alertBg = "bg-amber-500/5 border-amber-500/12 text-amber-300";
    alertIcon = AlertCircle;
    alertMessage = "Moderate usage warning: projected spent is on track to pass 50% of budget limits.";
  }

  const AlertIcon = alertIcon;

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm space-y-6 select-none flex flex-col justify-between h-full">
      <div>
        <h3 className="font-semibold text-base text-white">Cost Forecast & Budgets</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Track active Month-to-Date spends and projected monthly rates against organization budgets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center py-2">
        {/* SVG Circular Gauge */}
        <div className="relative h-40 w-full flex justify-center items-center">
          <svg className="h-36 w-36 -rotate-90">
            {/* Background Circle Track */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-zinc-850/60 fill-none"
              strokeWidth="10"
            />
            {/* Colored Foreground Circle Progress */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className={`fill-none transition-all duration-500 ${statusColor}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Circular Stats center overlay */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              Projected
            </span>
            <span className="text-lg font-black text-white mt-0.5">
              ${projectedSpend.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 mt-0.5">
              {pctProjected}% of cap
            </span>
          </div>
        </div>

        {/* Forecast Metrics breakdown and plan details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-semibold">Active Plan</span>
              <span className="font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase text-[9px] tracking-wider">
                {plan}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-zinc-500 font-semibold">Actual MTD Spent</span>
              <span className="font-bold text-white">${mtdSpend.toFixed(2)} ({pctActual}%)</span>
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-900">
              <span className="text-zinc-500 font-semibold">Monthly Budget Cap</span>
              <span className="font-bold text-white">${budget.toFixed(2)}</span>
            </div>
          </div>

          {/* Forecasting run-rate notes */}
          <div className="flex items-start gap-1.5 text-xxs text-zinc-400 italic">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
            <span>
              Projections assume linear run-rates based on elapsed days in the current calendar month.
            </span>
          </div>
        </div>
      </div>

      {/* Advisory Message Card */}
      <div className={`flex gap-2.5 p-3 rounded-xl border ${alertBg}`}>
        <AlertIcon className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="text-xxs leading-relaxed font-semibold">{alertMessage}</p>
      </div>
    </div>
  );
}
