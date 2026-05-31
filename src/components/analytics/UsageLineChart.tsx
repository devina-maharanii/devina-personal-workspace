/* eslint-disable react-hooks/static-components */
"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

export interface DailyUsagePoint {
  date: string;
  requests: number;
  tokens: number;
}

interface UsageLineChartProps {
  data: DailyUsagePoint[];
}

interface UsageTooltipItem {
  name?: string;
  color?: string;
  value?: number | string;
}

interface UsageTooltipProps {
  active?: boolean;
  payload?: UsageTooltipItem[];
  label?: string;
}

export default function UsageLineChart({ data }: UsageLineChartProps) {
  // Safe formatter for date label in tooltip
  const formatTooltipLabel = (label: string) => {
    try {
      return format(parseISO(label), "MMMM dd, yyyy");
    } catch {
      return label;
    }
  };

  // Safe formatter for ticks on XAxis
  const formatXAxisTick = (str: string) => {
    try {
      return format(parseISO(str), "MMM dd");
    } catch {
      return str;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  // Custom premium glassmorphic Tooltip
   
  const CustomTooltip = ({ active, payload, label }: UsageTooltipProps) => {
    const items = Array.isArray(payload) ? payload : [];
    if (active && items.length) {
      return (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-md shadow-2xl select-none min-w-[200px]">
          <p className="text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            {label ? formatTooltipLabel(label) : ""}
          </p>
          <div className="space-y-1.5">
            {items.map((item, index) => (
              <div key={`${String(item.name ?? "item")}-${index}`} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || "#71717a" }}
                  />
                  <span className="text-xs text-zinc-300">{String(item.name)}</span>
                </div>
                <span className="text-xs font-bold text-white">
                  {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value ?? "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm space-y-6">
      <div>
        <h3 className="font-semibold text-base text-white">AI Activity Timeline</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Monitor your daily request volumes and associated token consumption metrics.
        </p>
      </div>

      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: -5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxisTick}
              dy={10}
            />

            {/* Left Y-Axis for Requests */}
            <YAxis
              yAxisId="left"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(num) => num.toString()}
              dx={-5}
            />

            {/* Right Y-Axis for Tokens */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
              dx={5}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#27272a", strokeWidth: 1 }} />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
            />

            {/* Requests visual Area */}
            <Area
              yAxisId="left"
              name="AI Requests"
              type="monotone"
              dataKey="requests"
              fill="url(#requestsGrad)"
              stroke="#6366f1"
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />

            {/* Tokens visual Line */}
            <Line
              yAxisId="right"
              name="Tokens Consumed"
              type="monotone"
              dataKey="tokens"
              stroke="#d946ef"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
