/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getPlanByPriceId } from "@/lib/stripe";
import { Suspense } from "react";
import AdminChartsWrapper from "@/components/admin/AdminChartsWrapper";
import { 
  Users, 
  Building2, 
  DollarSign, 
  CreditCard,
  UserPlus,
  ChevronRight
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Ensure administrator authentication
  const _admin = await requireAdmin();

  // 1. Fetch Key System Statistics
  const [totalUsers, totalOrgs, payingUsersRaw, recentSignupsRaw] = await Promise.all([
    db.user.count(),
    db.organization.count(),
    db.user.findMany({
      where: {
        stripePriceId: { not: null },
        deletedAt: null,
      },
      select: {
        stripePriceId: true,
        createdAt: true,
      },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Compute Monthly Recurring Revenue (MRR)
  let mrr = 0;
  payingUsersRaw.forEach((user) => {
    const plan = getPlanByPriceId(user.stripePriceId || "");
    mrr += plan.price;
  });

  const activeSubscriptionsCount = payingUsersRaw.length;

  // 2. Fetch User Signups in the last 30 days (Optimized single-query grouping)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const usersInLast30Days = await db.user.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
    },
  });

  const newUsersTimeline = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const count = usersInLast30Days.filter((u) => {
      const uDate = new Date(u.createdAt);
      return (
        uDate.getDate() === d.getDate() &&
        uDate.getMonth() === d.getMonth() &&
        uDate.getFullYear() === d.getFullYear()
      );
    }).length;

    newUsersTimeline.push({
      date: label,
      count,
    });
  }

  // 3. Generate Historical Cumulative Monthly Revenue Trend (Last 6 Months)
  const now = new Date();
  const revenueHistoryTimeline = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });

    // End of the target month
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    let monthRevenue = 0;

    payingUsersRaw.forEach((user) => {
      if (user.createdAt <= monthEnd) {
        const plan = getPlanByPriceId(user.stripePriceId || "");
        monthRevenue += plan.price;
      }
    });

    revenueHistoryTimeline.push({
      month: monthLabel,
      revenue: monthRevenue,
    });
  }

  // Map recent signups with their plans
  const mappedRecentSignups = recentSignupsRaw.map((u) => {
    const activePlan = getPlanByPriceId(u.stripePriceId || "");
    return {
      ...u,
      plan: activePlan,
      status: u.deletedAt ? "SUSPENDED" : "ACTIVE",
    };
  });

  return (
    <div className="space-y-10">
      {/* Title & Headline Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Metrics & Overview
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5 font-medium">
          Comprehensive, real-time control metrics covering users growth, platform subscriptions, and financial aggregates.
        </p>
      </div>

      {/* Numerical Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Users</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">{totalUsers}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Registered system accounts</p>
          </div>
        </div>

        {/* Total Organizations Card */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Orgs</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">{totalOrgs}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Collaborative workspaces</p>
          </div>
        </div>

        {/* Estimated MRR Card */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Monthly MRR</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">${mrr.toLocaleString()}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Projected Stripe revenue</p>
          </div>
        </div>

        {/* Active Paid Subscriptions Card */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Paid Seats</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">{activeSubscriptionsCount}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Active paying subscription accounts</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Graphs Component (Lazy Loaded & Suspended) */}
      <Suspense fallback={<div className="h-96 w-full rounded-3xl bg-zinc-900/50 animate-pulse border border-zinc-800" />}>
        <AdminChartsWrapper 
          newUsersData={newUsersTimeline} 
          revenueData={revenueHistoryTimeline} 
        />
      </Suspense>

      {/* Recent Signups Control Panel */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-bold text-zinc-100">Recent Platform Signups</h3>
          </div>
          <Link 
            href="/admin/users" 
            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
          >
            <span>Inspect All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <th className="pb-3 px-4 font-semibold">User</th>
                <th className="pb-3 px-4 font-semibold">Email</th>
                <th className="pb-3 px-4 font-semibold">Subscription</th>
                <th className="pb-3 px-4 font-semibold">Joined At</th>
                <th className="pb-3 px-4 font-semibold">Account Status</th>
              </tr>
            </thead>
            <tbody>
              {mappedRecentSignups.map((signup) => (
                <tr 
                  key={signup.id} 
                  className="border-b border-zinc-800/40 text-zinc-300 hover:bg-zinc-800/20 transition-all"
                >
                  <td className="py-4 px-4 font-semibold text-zinc-100 flex items-center gap-3">
                    {signup.avatarUrl ? (
                      <img 
                        src={signup.avatarUrl} 
                        alt={signup.name || "User Avatar"} 
                        className="h-8 w-8 rounded-xl object-cover ring-1 ring-zinc-700 bg-zinc-900"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xs ring-1 ring-zinc-700">
                        {signup.name ? signup.name.slice(0, 2).toUpperCase() : signup.email.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span>{signup.name || "N/A"}</span>
                  </td>
                  <td className="py-4 px-4 text-zinc-400 font-medium">{signup.email}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      signup.plan.id === "enterprise"
                        ? "bg-purple-950/40 border border-purple-800/30 text-purple-400"
                        : signup.plan.id === "pro"
                        ? "bg-red-950/40 border border-red-800/30 text-red-400"
                        : "bg-zinc-800/50 border border-zinc-700/30 text-zinc-400"
                    }`}>
                      {signup.plan.name}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-zinc-500">
                    {new Date(signup.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                      signup.status === "ACTIVE"
                        ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/20"
                        : "bg-red-950/30 text-red-400 border border-red-800/20"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        signup.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                      {signup.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
