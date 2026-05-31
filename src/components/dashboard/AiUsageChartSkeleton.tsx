export default function AiUsageChartSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-6 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 animate-shimmer rounded w-40" />
          <div className="h-3 animate-shimmer rounded w-56 opacity-75" />
        </div>
        <div className="h-8 animate-shimmer rounded-xl w-36" />
      </div>

      <div className="h-64 bg-zinc-950/40 border border-zinc-900/50 rounded-xl flex flex-col justify-between p-4 relative overflow-hidden">
        <div className="flex justify-between items-center w-full">
          <div className="h-3 animate-shimmer rounded w-12" />
          <div className="h-0.5 animate-shimmer grow mx-4 opacity-50" />
        </div>
        <div className="flex justify-between items-center w-full">
          <div className="h-3 animate-shimmer rounded w-12" />
          <div className="h-0.5 animate-shimmer grow mx-4 opacity-50" />
        </div>
        <div className="flex justify-between items-center w-full">
          <div className="h-3 animate-shimmer rounded w-12" />
          <div className="h-0.5 animate-shimmer grow mx-4 opacity-50" />
        </div>
        <div className="flex justify-between items-center w-full">
          <div className="h-3 animate-shimmer rounded w-12" />
          <div className="h-0.5 animate-shimmer grow mx-4 opacity-50" />
        </div>
      </div>
    </div>
  );
}
