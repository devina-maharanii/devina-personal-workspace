"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO, subDays, isAfter } from "date-fns";

export interface ChartDataPoint {
  date: string; // YYYY-MM-DD
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

interface AiUsageChartProps {
  data: ChartDataPoint[];
}

export default function AiUsageChart({ data }: AiUsageChartProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // Filter and sort logs based on selected time range
  const filteredData = useMemo(() => {
    const limitDate = subDays(new Date(), timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90);
    const sorted = [...data]
      .filter((d) => isAfter(parseISO(d.date), limitDate))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fill missing dates if empty to ensure chart looks high-fidelity
    if (sorted.length === 0) {
      const emptyData: ChartDataPoint[] = [];
      const daysCount = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      for (let i = daysCount - 1; i >= 0; i--) {
        emptyData.push({
          date: format(subDays(new Date(), i), "yyyy-MM-dd"),
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
        });
      }
      return emptyData;
    }

    return sorted;
  }, [data, timeRange]);

  const totalPromptTokens = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.promptTokens, 0),
    [filteredData]
  );
  const totalCompletionTokens = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.completionTokens, 0),
    [filteredData]
  );

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg text-white">AI Usage History</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Visualizing prompt input and output completion tokens.
          </p>
        </div>

        {/* Segmented control toggle */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-850 self-start sm:self-center">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeRange === range
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-850/60">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500">Prompt Tokens</span>
          <p className="text-sm font-bold text-white mt-1">{totalPromptTokens.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500">Completion Tokens</span>
          <p className="text-sm font-bold text-white mt-1">{totalCompletionTokens.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500">Total Tokens</span>
          <p className="text-sm font-bold text-indigo-400 mt-1">
            {(totalPromptTokens + totalCompletionTokens).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500">Est. Total Cost</span>
          <p className="text-sm font-bold text-emerald-400 mt-1">
            ${((totalPromptTokens + totalCompletionTokens) * 0.000002).toFixed(4)}
          </p>
        </div>
      </div>

      {/* Line Chart Workspace */}
      <div className="h-[250px] md:h-[350px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="promptColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completionColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(str) => {
                try {
                  return format(parseISO(str), "MMM dd");
                } catch {
                  return str;
                }
              }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(num) => {
                if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                return num;
              }}
            />
            <Tooltip
              wrapperClassName="hidden md:block"
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                borderRadius: "12px",
                color: "#f4f4f5",
                fontSize: "11px",
              }}
              labelStyle={{ fontWeight: "bold", color: "#a1a1aa" }}
              labelFormatter={(label) => {
                try {
                  return format(parseISO(label), "MMMM dd, yyyy");
                } catch {
                  return label;
                }
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            <Line
              name="Input (Prompt) Tokens"
              type="monotone"
              dataKey="promptTokens"
              stroke="#818cf8"
              strokeWidth={2.5}
              activeDot={{ r: 6 }}
              dot={false}
            />
            <Line
              name="Output (Completion) Tokens"
              type="monotone"
              dataKey="completionTokens"
              stroke="#a855f7"
              strokeWidth={2.5}
              activeDot={{ r: 6 }}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
