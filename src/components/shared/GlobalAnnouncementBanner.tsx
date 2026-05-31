 
"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, AlertOctagon, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementProps {
  announcement: {
    id: string;
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "MAINTENANCE";
  } | null;
}

/**
 * GlobalAnnouncementBanner lists active maintenance schedules or features alerts.
 * Dismissal is statefully tracked per unique ID using local storage tags.
 */
export function GlobalAnnouncementBanner({ announcement }: AnnouncementProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!announcement) return;
    const isDismissed = localStorage.getItem(`announcement-dismissed-${announcement.id}`);
    if (!isDismissed) {
      setDismissed(false);
    }
  }, [announcement]);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(`announcement-dismissed-${announcement.id}`, "true");
    setDismissed(true);
  };

  const getStyleAndIcon = () => {
    switch (announcement.type) {
      case "WARNING":
        return {
          classes: "bg-amber-600/90 text-amber-50 border-amber-500/30",
          icon: <AlertCircle className="h-4 w-4 shrink-0" />,
        };
      case "MAINTENANCE":
        return {
          classes: "bg-rose-600/90 text-rose-50 border-rose-500/30",
          icon: <AlertOctagon className="h-4 w-4 shrink-0" />,
        };
      default:
        return {
          classes: "bg-indigo-600/90 text-indigo-50 border-indigo-500/30",
          icon: <HelpCircle className="h-4 w-4 shrink-0" />,
        };
    }
  };

  const { classes, icon } = getStyleAndIcon();

  return (
    <div
      className={cn(
        "relative border-b py-2.5 px-8 flex items-center justify-between text-xs font-semibold leading-relaxed shadow-sm z-40 transition-all",
        classes
      )}
    >
      <div className="flex items-center gap-2 mx-auto">
        {icon}
        <span>
          <strong>{announcement.title}:</strong> {announcement.message}
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-4 p-1 rounded-md hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default GlobalAnnouncementBanner;
