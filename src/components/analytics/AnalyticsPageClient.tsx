/* eslint-disable react-hooks/static-components */
"use client";

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Activity, RefreshCw, ShieldAlert } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import MetricsCards from "./MetricsCards";
import TopUsersTable from "./TopUsersTable";
import CostProjectionCard from "./CostProjectionCard";
import dynamic from "next/dynamic";

const UsageLineChart = dynamic(() => import("./UsageLineChart"), { ssr: false });
const FeatureBarChart = dynamic(() => import("./FeatureBarChart"), { ssr: false });
const TokenPieChart = dynamic(() => import("./TokenPieChart"), { ssr: false });

interface AnalyticsPageClientProps {
  orgId: string;
  orgName: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  });

export default function AnalyticsPageClient({ orgId, orgName }: AnalyticsPageClientProps) {
  const searchParams = useSearchParams();
  
  // Read params to compile the reactive cache key for SWR
  const range = searchParams.get("range") || "30d";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const queryParams = new URLSearchParams({ orgId, range });
  if (range === "custom") {
    if (from) queryParams.set("from", from);
    if (to) queryParams.set("to", to);
  }

  const { data, error, isLoading } = useSWR(
    `/api/analytics?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute client deduping
    }
  );

  // Skeletons representing original layout sizes
  const RenderSkeletons = () => (
    <div className="space-y-6">
      {/* 4 Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-5 h-28 rounded-2xl border border-zinc-800/80 bg-zinc-900/10 backdrop-blur-sm animate-pulse flex flex-col justify-between"
          >
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-zinc-800 rounded" />
              <div className="h-8 w-8 bg-zinc-800 rounded-xl" />
            </div>
            <div className="h-6 w-16 bg-zinc-800 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Line Chart Skeleton */}
      <div className="p-6 h-96 rounded-2xl border border-zinc-800/80 bg-zinc-900/10 backdrop-blur-sm animate-pulse flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-5 w-44 bg-zinc-800 rounded" />
          <div className="h-3 w-72 bg-zinc-800 rounded" />
        </div>
        <div className="h-60 bg-zinc-800/40 rounded-xl w-full flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-zinc-600 animate-spin" />
        </div>
      </div>

      {/* Dual Column Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-6 h-80 rounded-2xl border border-zinc-800/80 bg-zinc-900/10 backdrop-blur-sm animate-pulse flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="h-5 w-40 bg-zinc-800 rounded" />
              <div className="h-3.5 w-60 bg-zinc-800 rounded" />
            </div>
            <div className="h-44 bg-zinc-800/40 rounded-xl mt-4" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 select-none">
      {/* Title Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/60 to-zinc-900/30 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
            Workspace Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Analyze token expenditure, feature request distribution, and latency aggregates.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 w-fit shrink-0">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-300">
            Workspace: {orgName}
          </span>
        </div>
      </div>

      {/* Date Range Picker Toolbar */}
      <DateRangePicker />

      {/* Error handling layout */}
      {error && (
        <div className="flex gap-3 p-4 rounded-xl border border-rose-950/60 bg-rose-950/20 text-rose-300 items-start">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Failed to fetch analytics statistics</p>
            <p className="text-xs text-rose-400 mt-1">
              There was an issue retrieving the database aggregates for this organization.
            </p>
          </div>
        </div>
      )}

      {/* SWR Content / Skeletons conditional render */}
      {isLoading && !data ? (
        <RenderSkeletons />
      ) : data ? (
        <div className="space-y-6">
          {/* Top Metrics cards */}
          <MetricsCards metrics={data.metrics} />

          {/* Core Timeline chart */}
          <UsageLineChart data={data.dailyUsage} />

          {/* Sub Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Feature Usage horizontal bar chart */}
            <FeatureBarChart data={data.featureUsage} />

            {/* Cost projections gauges */}
            <CostProjectionCard projection={data.costProjection} />

            {/* Token ratio donut charts */}
            <TokenPieChart data={data.tokenBreakdown} />

            {/* Top Org users table */}
            <TopUsersTable data={data.userUsage} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
