"use client";

import { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion";
import { Sparkles, Users, HardDrive, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useRealtimeStore } from "@/stores/realtimeStore";

export interface MetricCard {
  label: string;
  value: number;
  limit?: number;
  formattedValue?: string;
  subtext: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  type: "credits" | "members" | "storage" | "subscription";
}

interface StatsGridProps {
  metrics: MetricCard[];
}

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate(latest) {
        node.textContent = Math.round(latest).toLocaleString();
      },
    });

    return () => controls.stop();
  }, [value]);

  return <span ref={ref}>0</span>;
}

export default function StatsGrid({ metrics }: StatsGridProps) {
  const icons = {
    credits: Sparkles,
    members: Users,
    storage: HardDrive,
    subscription: CreditCard,
  };

  const liveCreditsRemaining = useRealtimeStore((state) => state.creditsRemaining);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = icons[metric.type] || Sparkles;
        const hasLimit = metric.limit !== undefined && metric.limit > 0;
        
        let displayValue = metric.value;
        let subtext = metric.subtext;
        
        if (metric.type === 'credits' && liveCreditsRemaining !== null && metric.limit) {
           displayValue = metric.limit - liveCreditsRemaining;
           subtext = `${liveCreditsRemaining} credits left`;
        }

        const percentage = hasLimit ? Math.min((displayValue / (metric.limit || 1)) * 100, 100) : 0;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group relative p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700/80 transition-all duration-300 overflow-hidden"
          >
            {/* Glowing Corner Background */}
            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-all duration-500" />

            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                {metric.label}
              </span>
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:bg-zinc-850 group-hover:border-zinc-700 text-indigo-400 transition-all duration-300">
                <IconComponent className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-baseline gap-1.5">
                {metric.formattedValue ? (
                  <span className="text-2xl font-extrabold tracking-tight text-white">
                    {metric.formattedValue}
                  </span>
                ) : (
                  <span className="text-3xl font-extrabold tracking-tight text-white">
                    <AnimatedNumber value={displayValue} />
                  </span>
                )}

                {hasLimit && (
                  <span className="text-zinc-500 text-sm font-semibold">
                    / {metric.limit?.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Progress bar for storage/usage quotas */}
              {metric.type === "storage" && hasLimit && (
                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900/50 mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <span className="truncate max-w-[170px]">{subtext}</span>
                {metric.trend && (
                  <span
                    className={`flex items-center gap-0.5 font-bold shrink-0 ${
                      metric.trend.isPositive ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {metric.trend.isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {metric.trend.value}%
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
