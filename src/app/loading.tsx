export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex" aria-label="Loading" aria-busy="true">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 border-r border-zinc-800/60 p-4 gap-3">
        {/* Logo */}
        <div className="h-9 w-36 rounded-xl bg-zinc-800/60 animate-pulse mb-4" />
        {/* Nav items */}
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <div className="h-5 w-5 rounded-md bg-zinc-800/60 animate-pulse shrink-0" />
            <div
              className="h-4 rounded-md bg-zinc-800/60 animate-pulse"
              style={{ width: `${60 + (i % 3) * 20}%` }}
            />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-6 shrink-0">
          <div className="h-6 w-40 rounded-lg bg-zinc-800/60 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-9 w-9 rounded-full bg-zinc-800/60 animate-pulse" />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6 space-y-6 overflow-hidden">
          {/* Page title */}
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-xl bg-zinc-800/60 animate-pulse" />
            <div className="h-4 w-80 rounded-lg bg-zinc-800/40 animate-pulse" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 animate-pulse h-28 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="h-4 w-24 rounded-md bg-zinc-800/60" />
                  <div className="h-8 w-8 rounded-xl bg-zinc-800/60" />
                </div>
                <div className="h-7 w-16 rounded-lg bg-zinc-800/60" />
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 h-72 animate-pulse space-y-4">
            <div className="h-5 w-44 rounded-lg bg-zinc-800/60" />
            <div className="h-48 w-full rounded-xl bg-zinc-800/30" />
          </div>

          {/* Table skeleton */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800/60">
              <div className="h-5 w-36 rounded-lg bg-zinc-800/60 animate-pulse" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800/30 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-zinc-800/60 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 rounded-md bg-zinc-800/60" />
                  <div className="h-3 w-60 rounded-md bg-zinc-800/40" />
                </div>
                <div className="h-6 w-16 rounded-full bg-zinc-800/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
