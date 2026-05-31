"use client";

import { CommandPalette } from "@/components/shared/CommandPalette";
import { useSSE } from "@/hooks/useSSE";

/**
 * DashboardLayoutWrapper coordinates client-side layout adjustments
 * and registers key listeners for command palette overlays.
 */
export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  useSSE();

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-screen">
      <CommandPalette />
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayoutWrapper;
