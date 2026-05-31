import { Suspense } from "react";
import { requireAuth, getActiveOrg } from "@/lib/auth";
import StatsGridContainer from "@/components/dashboard/StatsGridContainer";
import StatsGridSkeleton from "@/components/dashboard/StatsGridSkeleton";
import AiUsageChartContainer from "@/components/dashboard/AiUsageChartContainer";
import AiUsageChartSkeleton from "@/components/dashboard/AiUsageChartSkeleton";
import RecentActivityContainer from "@/components/dashboard/RecentActivityContainer";
import RecentActivitySkeleton from "@/components/dashboard/RecentActivitySkeleton";
import PlanStatusContainer from "@/components/dashboard/PlanStatusContainer";
import { PlanStatusSkeleton, OnboardingChecklistSkeleton } from "@/components/dashboard/PlanStatusSkeleton";
import OnboardingChecklistContainer from "@/components/dashboard/OnboardingChecklistContainer";
import QuickActions from "@/components/dashboard/QuickActions";
import GeminiPlayground from "@/components/dashboard/GeminiPlayground";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Authenticate user session
  const user = await requireAuth();

  // 2. Fetch active organization scope
  const org = await getActiveOrg(user.id);

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Card banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-zinc-805 bg-gradient-to-r from-zinc-900/60 to-zinc-900/30 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Welcome back, {user.name || "User"}!
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Manage your workspace settings, check token statistics, and deploy unified models.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 w-fit shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-300">
            Active Workspace: {org.name}
          </span>
        </div>
      </div>

      {/* Onboarding Checklist (for new organizations) */}
      <Suspense fallback={<OnboardingChecklistSkeleton />}>
        <OnboardingChecklistContainer
          organizationId={org.id}
          logo={org.logo}
          onboardingCompleted={org.onboardingCompleted}
          subscriptionStatus={user.subscriptionStatus}
        />
      </Suspense>

      {/* Stats Cards Grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGridContainer
          userId={user.id}
          organizationId={org.id}
          plan={org.plan}
          maxMembers={org.maxMembers}
          maxAiCredits={org.maxAiCredits}
          usedAiCredits={org.usedAiCredits}
          subscriptionStatus={user.subscriptionStatus}
          currentPeriodEnd={user.currentPeriodEnd}
        />
      </Suspense>

      {/* Main Charts & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Charts & Actions (2/3 width on wide screens) */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<AiUsageChartSkeleton />}>
            <AiUsageChartContainer organizationId={org.id} />
          </Suspense>

          <QuickActions />
        </div>

        {/* Recent logs and plan thresholds (1/3 width) */}
        <div className="space-y-6">
          <Suspense fallback={<PlanStatusSkeleton />}>
            <PlanStatusContainer
              userId={user.id}
              organizationId={org.id}
              plan={org.plan}
              maxMembers={org.maxMembers}
              maxAiCredits={org.maxAiCredits}
              usedAiCredits={org.usedAiCredits}
              subscriptionStatus={user.subscriptionStatus}
              currentPeriodEnd={user.currentPeriodEnd}
            />
          </Suspense>

          <Suspense fallback={<RecentActivitySkeleton />}>
            <RecentActivityContainer organizationId={org.id} />
          </Suspense>
        </div>
      </div>

      {/* AI sandbox playground section */}
      <GeminiPlayground />
    </div>
  );
}
