import { getCurrentUser } from "@/lib/auth";
import { stripe, PLANS, getPlanByPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BillingButtons } from "@/components/dashboard/BillingButtons";
import { CloudLightning, Users, HardDrive, Receipt, Download } from "lucide-react";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

/**
 * BillingPage is a server component that renders subscription tier details,
 * aggregates real usage metrics from DB logs, and fetches invoice history from Stripe.
 */
export default async function BillingPage() {
  // 1. Authenticate user
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    redirect("/sign-in");
  }

  // 2. Fetch usage stats from DB
  const aiCreditsUsed = await db.aiUsageLog.count({
    where: { userId: dbUser.id },
  });

  const membersCount = await db.membership.count({
    where: { userId: dbUser.id },
  });

  const files = await db.file.findMany({
    where: { userId: dbUser.id },
    select: { size: true },
  });
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalStorageGB = totalSizeBytes / (1024 * 1024 * 1024);

  // 3. Resolve Active Plan Limits
  const isActive = dbUser.subscriptionStatus === "ACTIVE" || dbUser.subscriptionStatus === "TRIALING";
  const activePlan = isActive ? getPlanByPriceId(dbUser.stripePriceId || "") : PLANS.FREE;

  const aiCreditsLimit = activePlan.limits.aiCredits;
  const membersLimit = activePlan.limits.members;
  const storageLimitStr = activePlan.limits.storage;
  const storageLimitGB = parseInt(storageLimitStr, 10);

  const aiCreditsPercent = Math.min(Math.round((aiCreditsUsed / aiCreditsLimit) * 100), 100);
  const membersPercent = Math.min(Math.round((membersCount / membersLimit) * 100), 100);
  const storagePercent = Math.min(Math.round((totalStorageGB / storageLimitGB) * 100), 100);

  // 4. Fetch invoice history from Stripe
  let invoices: Stripe.Invoice[] = [];
  if (dbUser.stripeCustomerId) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: dbUser.stripeCustomerId,
        limit: 10,
      });
      invoices = stripeInvoices.data;
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    }
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto px-4 py-8 text-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Billing & Subscription
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Manage your subscription plans, team limits, and view invoice history safely secured by Stripe.
        </p>
      </div>

      {/* Main Grid: Plan Status + Progress Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active plan card */}
        <div className="lg:col-span-1 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Active Plan</span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-extrabold">{activePlan.name}</h2>
              {isActive && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                  Active
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-sm">{activePlan.description}</p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <div className="text-xs text-zinc-500">Status</div>
              <div className="text-sm font-semibold capitalize text-zinc-200">
                {dbUser.subscriptionStatus.toLowerCase().replace("_", " ")}
              </div>
            </div>

            {dbUser.currentPeriodEnd && (
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-500">Billing Period Renews</div>
                <div className="text-sm font-semibold text-zinc-200">
                  {dbUser.currentPeriodEnd.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            )}
            
            <BillingButtons
              stripeCustomerId={dbUser.stripeCustomerId}
              subscriptionStatus={dbUser.subscriptionStatus}
              stripePriceId={dbUser.stripePriceId}
              planId={activePlan.id}
            />
          </div>
        </div>

        {/* Usage stats card */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <CloudLightning className="h-5 w-5 text-indigo-400" /> Usage Metrics
          </h3>

          <div className="space-y-6">
            {/* AI Credits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-2">
                  <CloudLightning className="h-4 w-4 text-zinc-500" /> AI Generation Credits
                </span>
                <span className="font-semibold text-zinc-200">
                  {aiCreditsUsed} <span className="text-zinc-500">/ {aiCreditsLimit}</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${aiCreditsPercent}%` }}
                />
              </div>
              <div className="text-xxs text-zinc-500">Reset monthly based on subscription renewal cycle.</div>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-500" /> Organization Seats
                </span>
                <span className="font-semibold text-zinc-200">
                  {membersCount} <span className="text-zinc-500">/ {membersLimit}</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${membersPercent}%` }}
                />
              </div>
              <div className="text-xxs text-zinc-500">Seats currently occupied in your workspace.</div>
            </div>

            {/* Storage Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-zinc-500" /> Media File Storage
                </span>
                <span className="font-semibold text-zinc-200">
                  {totalStorageGB.toFixed(2)} GB <span className="text-zinc-500">/ {storageLimitStr}</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <div className="text-xxs text-zinc-500">Calculates cumulative file sizes uploaded in settings dashboard.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History Section */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6">
        <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <Receipt className="h-5 w-5 text-indigo-400" /> Invoice History
        </h3>

        {invoices.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 text-zinc-500 text-sm">
            No payments or receipts registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-950/40 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Invoice Number</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-transparent">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">{inv.number || inv.id.substring(0, 12)}</td>
                    <td className="px-6 py-4">
                      {new Date(inv.created * 1000).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      ${(inv.amount_paid / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          inv.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.invoice_pdf ? (
                        <a
                          href={inv.invoice_pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
