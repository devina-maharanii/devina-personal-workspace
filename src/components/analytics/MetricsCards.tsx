"use client";

import { Cpu, Coins, DollarSign, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface Metrics {
  requests: { value: number; change: number };
  tokens: { value: number; change: number };
  cost: { value: number; change: number };
  responseTime: { value: number; change: number };
}

interface MetricsCardsProps {
  metrics: Metrics;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const renderTrendBadge = (change: number, invertColor = false) => {
    const isZero = change === 0;
    const isPositive = change > 0;
    
    // For response time, lower values are better (invert colors)
    const isGood = invertColor ? !isPositive : isPositive;

    if (isZero) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-850 text-xxs font-bold text-zinc-400">
          <Minus className="h-3 w-3 shrink-0" />
          <span>0%</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg border text-xxs font-bold uppercase tracking-wider ${
          isGood
            ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-400"
            : "bg-rose-950/40 border-rose-900/60 text-rose-400"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3 shrink-0" />
        ) : (
          <TrendingDown className="h-3 w-3 shrink-0" />
        )}
        <span>{isPositive ? "+" : ""}{change}%</span>
      </span>
    );
  };

  const cards = [
    {
      title: "Total AI Requests",
      value: metrics.requests.value.toLocaleString(),
      change: metrics.requests.change,
      icon: Cpu,
      iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      description: "AI completions invoked",
    },
    {
      title: "Total Tokens Used",
      value: formatNumber(metrics.tokens.value),
      change: metrics.tokens.change,
      icon: Coins,
      iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      description: "Combined prompt & completion tokens",
    },
    {
      title: "Estimated Cost",
      value: `$${metrics.cost.value.toFixed(2)}`,
      change: metrics.cost.change,
      icon: DollarSign,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Aggregated model expenditures",
    },
    {
      title: "Avg. Response Time",
      value: `${metrics.responseTime.value}ms`,
      change: metrics.responseTime.change,
      icon: Zap,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "Estimated completion latency",
      invertTrend: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="relative p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-between hover:border-zinc-700/60 transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {card.title}
                </span>
                <p className="text-2xl font-black text-white mt-1.5 tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className={`p-2 rounded-xl border ${card.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-850/60">
              <span className="text-xxs text-zinc-400 leading-none">
                {card.description}
              </span>
              {renderTrendBadge(card.change, card.invertTrend)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
