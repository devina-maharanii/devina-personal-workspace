export function PlanStatusSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 bg-zinc-800 rounded w-48" />
        <div className="h-3.5 bg-zinc-850 rounded w-24" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-zinc-800 rounded w-20" />
              <div className="h-3 bg-zinc-800 rounded w-12" />
            </div>
            <div className="h-2 bg-zinc-900 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OnboardingChecklistSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-zinc-800 rounded w-48" />
        <div className="h-4 bg-zinc-800 rounded w-8" />
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="h-4 w-4 bg-zinc-800 rounded shrink-0" />
            <div className="h-3.5 bg-zinc-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
