/* eslint-disable react-hooks/static-components */
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export interface FeatureUsagePoint {
  feature: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface FeatureBarChartProps {
  data: FeatureUsagePoint[];
}

interface FeatureTooltipEntry {
  payload: FeatureUsagePoint;
}

interface FeatureTooltipProps {
  active?: boolean;
  payload?: FeatureTooltipEntry[];
}

const FEATURE_COLORS: Record<string, string> = {
  Chat: "#6366f1",       // Indigo
  Summarize: "#10b981",  // Emerald
  Generate: "#a855f7",   // Purple
  Vision: "#06b6d4",     // Cyan
  Other: "#71717a",      // Zinc
};

export default function FeatureBarChart({ data }: FeatureBarChartProps) {
  const getFeatureColor = (feature: string) => {
    return FEATURE_COLORS[feature] || FEATURE_COLORS.Other;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  // Custom tooltips
   
  const CustomTooltip = ({ active, payload }: FeatureTooltipProps) => {
    if (active && payload && payload.length) {
      const info = payload[0].payload as FeatureUsagePoint;
      const color = getFeatureColor(info.feature);
      return (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-md shadow-2xl select-none min-w-[180px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-900">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              {info.feature}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-zinc-400">Total Requests</span>
              <span className="text-xs font-semibold text-white">{info.requests.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-zinc-400">Tokens Consumed</span>
              <span className="text-xs font-semibold text-white">{formatNumber(info.tokens)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-zinc-400">Estimated Cost</span>
              <span className="text-xs font-bold text-emerald-400">${info.cost.toFixed(3)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm h-full flex flex-col justify-center items-center text-center py-20 select-none">
        <p className="text-sm font-semibold text-zinc-400">No Feature Data Available</p>
        <p className="text-xs text-zinc-500 mt-1">Try expanding your time window parameters.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm space-y-6">
      <div>
        <h3 className="font-semibold text-base text-white">Usage by Product Feature</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Distribute total request volumes across individual AI service categories.
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            
            <XAxis
              type="number"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(num) => num.toString()}
            />
            
            <YAxis
              type="category"
              dataKey="feature"
              stroke="#e4e4e7"
              fontSize={11}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              width={100}
              dx={10}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#27272a", opacity: 0.15 }} />

            <Bar dataKey="requests" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry, index) => {
                const color = getFeatureColor(entry.feature);
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
