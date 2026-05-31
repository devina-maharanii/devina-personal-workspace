/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  getAllSubscriptions, 
  cancelSubscription, 
  giveFreeMonth 
} from "@/lib/actions/admin";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  ExternalLink,
  Ban,
  CheckCircle,
  RefreshCw,
  Gift
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface SubscriptionItem {
  id: string;
  name: string;
  email: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | Date | null;
  plan: {
    id: string;
    name: string;
    price: number;
  };
}

interface SubscriptionsPageClientProps {
   
  initialSubscriptions: SubscriptionItem[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function SubscriptionsPageClient({ 
  initialSubscriptions, 
  initialPagination 
}: SubscriptionsPageClientProps) {
  // Client state
   
  const [subs, setSubs] = useState<SubscriptionItem[]>(initialSubscriptions);
  const [pagination, setPagination] = useState(initialPagination);
  const [plan, setPlan] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  // UI state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");

  // Load subscriptions
  const fetchSubscriptions = () => {
    startTransition(async () => {
      try {
        const result = await getAllSubscriptions({
          page,
          limit: 10,
          plan,
          status,
        });
        setSubs(result.subscriptions);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
      }
    });
  };

  // Trigger load when page/filters change
  useEffect(() => {
    fetchSubscriptions();
  }, [page, plan, status]);

  // Cancel premium action
  const handleCancelSub = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to CANCEL Stripe subscription for ${userEmail} immediately? This downgrades the user to the Free plan tier and sends an in-app notice.`)) return;
    setActiveMenuId(null);
    startTransition(async () => {
      try {
        await cancelSubscription(userId);
        fetchSubscriptions();
        setSuccessMsg(`Successfully cancelled subscription for ${userEmail}.`);
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to cancel subscription."));
      }
    });
  };

  // Give Free Month action
  const handleGiveFreeMonth = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to grant 30 extra free days to ${userEmail}? This shifts their next period billing renewal date forward locally.`)) return;
    setActiveMenuId(null);
    startTransition(async () => {
      try {
        await giveFreeMonth(userId);
        fetchSubscriptions();
        setSuccessMsg(`Granted +30 free days to ${userEmail}.`);
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to grant free month."));
      }
    });
  };

  return (
    <div className="space-y-8 text-white">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Active Subscriptions
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Manage billing seats, cancel plans, view customer profiles in Stripe, or grant free extensions.
          </p>
        </div>
        
        {isPending && (
          <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest bg-red-950/20 px-3 py-1.5 rounded-full border border-red-500/20">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing database...</span>
          </div>
        )}

        {successMsg && !isPending && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <CheckCircle className="h-4.5 w-4.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Filtering Box */}
      <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-wrap items-center gap-4">
        {/* Plan Filter */}
        <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
          <span>Plan Segment:</span>
          <select
            value={plan}
            onChange={(e) => { setPlan(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
          >
            <option value="ALL">All Plans</option>
            <option value="PRO">Pro Tier</option>
            <option value="ENTERPRISE">Enterprise Tier</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
          <span>Stripe Status:</span>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md overflow-hidden relative">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider select-none">
                <th className="pb-3 px-4 font-semibold">User Customer</th>
                <th className="pb-3 px-4 font-semibold">Price Tier</th>
                <th className="pb-3 px-4 font-semibold">Status</th>
                <th className="pb-3 px-4 font-semibold">Amount</th>
                <th className="pb-3 px-4 font-semibold">Next Renewal / Billing</th>
                <th className="pb-3 px-4 font-semibold">Stripe ID Segment</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-medium">
                    No active premium subscriptions found matching your query filters.
                  </td>
                </tr>
              ) : (
                subs.map((sub) => (
                  <tr 
                    key={sub.id} 
                    className="border-b border-zinc-800/40 text-zinc-300 hover:bg-zinc-800/10 transition-all group"
                  >
                    <td className="py-4 px-4 font-semibold text-zinc-100">
                      <div>{sub.name}</div>
                      <div className="text-zinc-550 font-mono text-xxs mt-0.5">{sub.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        sub.plan.id === "enterprise"
                          ? "bg-purple-950/40 border border-purple-800/30 text-purple-400"
                          : "bg-indigo-950/40 border border-indigo-800/30 text-indigo-400"
                      }`}>
                        {sub.plan.name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                        sub.status === "ACTIVE" || sub.status === "TRIALING"
                          ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/20"
                          : "bg-amber-950/30 text-amber-400 border border-amber-800/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          sub.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
                        }`} />
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-zinc-200">
                      ${sub.plan.price} <span className="text-zinc-500 font-normal text-xxs">/ mo</span>
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-400 text-xs">
                      {sub.currentPeriodEnd ? (
                        new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 px-4 text-zinc-500 font-mono text-xxs">
                      <div>Sub: {sub.stripeSubscriptionId?.slice(0, 14)}...</div>
                      <div className="mt-0.5 text-zinc-550">Cust: {sub.stripeCustomerId?.slice(0, 14)}...</div>
                    </td>
                    <td className="py-4 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        {/* External Stripe view Link */}
                        <a
                          href={`https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                          title="View subscription record directly inside Stripe Dashboard"
                        >
                          <ExternalLink className="h-4.5 w-4.5" />
                        </a>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === sub.id ? null : sub.id)}
                            className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                          >
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </button>

                          {activeMenuId === sub.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] z-20">
                                <button
                                  onClick={() => handleGiveFreeMonth(sub.id, sub.email)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-emerald-400 hover:bg-emerald-950/20 transition-colors"
                                >
                                  <Gift className="h-4.5 w-4.5 text-emerald-400" />
                                  <span>Give 30 Free Days</span>
                                </button>

                                <div className="h-px bg-zinc-900 my-1.5" />

                                <button
                                  onClick={() => handleCancelSub(sub.id, sub.email)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-950/40 transition-colors"
                                >
                                  <Ban className="h-4.5 w-4.5 text-red-500" />
                                  <span>Cancel Subscription</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/40 text-xs text-zinc-500 font-medium">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} active billing seats)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1 || isPending}
                onClick={() => setPage(page - 1)}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                disabled={page === pagination.totalPages || isPending}
                onClick={() => setPage(page + 1)}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
