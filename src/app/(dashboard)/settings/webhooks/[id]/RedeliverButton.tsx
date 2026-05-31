"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { redeliverWebhook } from "@/lib/actions/webhooks";
import { toast } from "sonner";

export default function RedeliverButton({ deliveryId }: { deliveryId: string }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRedeliver = async () => {
    setIsRetrying(true);
    try {
      await redeliverWebhook(deliveryId);
      toast.success("Redelivery triggered");
    } catch (_e) {
      toast.error("Failed to redeliver webhook");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRedeliver}
      disabled={isRetrying}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
    >
      <RefreshCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
      Redeliver
    </button>
  );
}
