"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { ChartDataPoint } from "./AiUsageChart";

const AiUsageChart = dynamic(() => import("./AiUsageChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-xl border border-zinc-800/80 bg-zinc-900/10 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
    </div>
  ),
});

interface AiUsageChartWrapperProps {
  data: ChartDataPoint[];
}

export default function AiUsageChartWrapper({ data }: AiUsageChartWrapperProps) {
  return <AiUsageChart data={data} />;
}
