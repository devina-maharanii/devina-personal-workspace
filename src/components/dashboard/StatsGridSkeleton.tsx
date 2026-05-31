export default function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4 overflow-hidden relative"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 animate-shimmer rounded w-24" />
            <div className="h-5 w-5 animate-shimmer rounded-lg" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-8 animate-shimmer rounded w-16" />
            <div className="h-3 animate-shimmer rounded w-32 opacity-75" />
          </div>
        </div>
      ))}
    </div>
  );
}
