"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Clock } from "lucide-react";
import { format, subDays } from "date-fns";

export default function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read state from URL search parameters or default
  const activeRange = searchParams.get("range") || "30d";
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";

  const [fromVal, setFromVal] = useState(fromParam || format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [toVal, setToVal] = useState(toParam || format(new Date(), "yyyy-MM-dd"));

  const updateRange = (range: string, customFrom?: string, customTo?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    
    if (range === "custom") {
      params.set("from", customFrom || fromVal);
      params.set("to", customTo || toVal);
    } else {
      params.delete("from");
      params.delete("to");
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRange("custom", fromVal, toVal);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm select-none">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-indigo-400" />
        <span className="text-sm font-semibold text-zinc-300">Time Window</span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Quick Range Selection Buttons */}
        <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-850">
          {[
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
            { id: "custom", label: "Custom" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => updateRange(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeRange === item.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs Form */}
        {activeRange === "custom" && (
          <form
            onSubmit={handleCustomDateSubmit}
            className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0 animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-300 text-xs">
              <span className="text-zinc-500 uppercase font-bold text-[9px]">From</span>
              <input
                type="date"
                value={fromVal}
                onChange={(e) => setFromVal(e.target.value)}
                className="bg-transparent border-none text-white outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-300 text-xs">
              <span className="text-zinc-500 uppercase font-bold text-[9px]">To</span>
              <input
                type="date"
                value={toVal}
                onChange={(e) => setToVal(e.target.value)}
                className="bg-transparent border-none text-white outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-750 text-xs font-semibold text-white rounded-xl border border-zinc-750 transition-all cursor-pointer shrink-0"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
