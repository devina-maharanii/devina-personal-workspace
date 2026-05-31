/* eslint-disable react-hooks/static-components */
"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export interface TokenBreakdown {
  prompt: number;
  completion: number;
  total: number;
}

interface TokenPieChartProps {
  data: TokenBreakdown;
}

interface TokenTooltipEntry {
  name?: string;
  value?: number;
  payload: { color: string };
}

interface TokenTooltipProps {
  active?: boolean;
  payload?: TokenTooltipEntry[];
}

export default function TokenPieChart({ data }: TokenPieChartProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const promptPct = data.total > 0 ? Math.round((data.prompt / data.total) * 100) : 0;
  const completionPct = data.total > 0 ? Math.round((data.completion / data.total) * 100) : 0;

  const pieData = [
    { name: "Input (Prompt)", value: data.prompt, color: "#818cf8" },
    { name: "Output (Completion)", value: data.completion, color: "#a855f7" },
  ];

  // Custom tooltips
   
  const CustomTooltip = ({ active, payload }: TokenTooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const value = item?.value ?? 0;
      const pct = data.total > 0 ? Math.round((value / data.total) * 100) : 0;
      return (
        <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-md shadow-2xl select-none text-xxs">
          <div className="flex items-center gap-1.5 font-bold text-white mb-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item?.payload?.color || "#818cf8" }} />
            <span>{item.name}</span>
          </div>
          <p className="text-zinc-300 font-semibold">
            {value.toLocaleString()} tokens ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm space-y-6 select-none flex flex-col justify-between h-full">
      <div>
        <h3 className="font-semibold text-base text-white">Token Usage Ratio</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Distinguish between model input prompts and completion outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center py-4">
        {/* Pie donut container */}
        <div className="relative h-44 w-full flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered statistics overlay */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Total
            </span>
            <span className="text-xl font-black text-white mt-0.5">
              {formatNumber(data.total)}
            </span>
          </div>
        </div>

        {/* Text descriptions and legend */}
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-850/60 space-y-3">
            {/* Input segment descriptor */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded bg-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white leading-none">Input Tokens</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{formatNumber(data.prompt)} tokens</p>
                </div>
              </div>
              <span className="text-xs font-black text-indigo-400 leading-none">{promptPct}%</span>
            </div>

            {/* Output segment descriptor */}
            <div className="flex items-start justify-between gap-4 pt-3 border-t border-zinc-900/60">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded bg-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white leading-none">Output Tokens</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{formatNumber(data.completion)} tokens</p>
                </div>
              </div>
              <span className="text-xs font-black text-purple-400 leading-none">{completionPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
