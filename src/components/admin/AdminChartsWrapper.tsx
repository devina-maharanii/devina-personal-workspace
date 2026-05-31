"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const AdminCharts = dynamic(
  () => import("./AdminCharts").then((mod) => mod.AdminCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    ),
  }
);

interface ChartDataPoint {
  date: string;
  count: number;
}

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface AdminChartsWrapperProps {
  newUsersData: ChartDataPoint[];
  revenueData: RevenueDataPoint[];
}

export default function AdminChartsWrapper(props: AdminChartsWrapperProps) {
  return <AdminCharts {...props} />;
}
