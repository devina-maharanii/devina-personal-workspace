"use client";

import { useState } from "react";
import { Loader2, CreditCard, ArrowUpRight } from "lucide-react";
import { PLANS } from "@/lib/clientPlans";

interface BillingButtonsProps {
  stripeCustomerId: string | null;
  subscriptionStatus: string;
  stripePriceId: string | null;
  planId?: string;
}

/**
 * BillingButtons provides client-side interaction triggers on the billing dashboard.
 * Initiates POST requests to create-portal or create-checkout endpoints.
 */
export function BillingButtons({ stripeCustomerId, subscriptionStatus, planId }: BillingButtonsProps) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  const handlePortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create billing portal");
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert("Could not load billing portal. Please verify you have an active subscription.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleCheckout = async (priceId: string, planName: string) => {
    setLoadingCheckout(priceId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) throw new Error("Failed to start checkout");
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert(`Could not start checkout for ${planName}.`);
    } finally {
      setLoadingCheckout(null);
    }
  };

  const isPro = planId === "pro" && (subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING");
  const isEnterprise = planId === "enterprise" && (subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING");

  return (
    <div className="flex flex-wrap gap-4 mt-6">
      {stripeCustomerId && (
        <button
          onClick={handlePortal}
          disabled={loadingPortal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          {loadingPortal ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4 text-zinc-400" />
          )}
          Manage Billing Portal
        </button>
      )}

      {!isPro && !isEnterprise && (
        <button
          onClick={() => handleCheckout(PLANS.PRO.priceId, "Pro")}
          disabled={!!loadingCheckout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
        >
          {loadingCheckout === PLANS.PRO.priceId ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
          Upgrade to Pro
        </button>
      )}

      {isPro && (
        <button
          onClick={() => handleCheckout(PLANS.ENTERPRISE.priceId, "Enterprise")}
          disabled={!!loadingCheckout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/20"
        >
          {loadingCheckout === PLANS.ENTERPRISE.priceId ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
          Upgrade to Enterprise
        </button>
      )}
    </div>
  );
}
