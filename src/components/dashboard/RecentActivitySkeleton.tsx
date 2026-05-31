export default function RecentActivitySkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-6 overflow-hidden relative">
      <div className="flex items-center justify-between">
        <div className="h-5 animate-shimmer rounded w-36" />
        <div className="h-4 animate-shimmer rounded w-16" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 py-2">
            <div className="h-8 w-8 rounded-full animate-shimmer shrink-0" />
            <div className="space-y-1.5 grow">
              <div className="h-3 animate-shimmer rounded w-3/4" />
              <div className="h-2.5 animate-shimmer rounded w-1/4 opacity-75" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
