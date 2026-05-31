import { requireAdmin } from "@/lib/auth";
import { ArrowUpRight, BarChart3, Users, LineChart, PieChart } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Product Analytics | Settings",
  noIndex: true,
});

export default async function ProductAnalyticsPage() {
  await requireAdmin();

  // The PostHog dashboard iframe URL goes here.
  // Generate a Shared Dashboard Link in PostHog -> Dashboards -> Share -> Enable sharing -> Embed
  const POSTHOG_DASHBOARD_IFRAME_URL = process.env.POSTHOG_SHARED_DASHBOARD_URL || "";

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Product Analytics</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Monitor real-time user engagement, conversion funnels, and feature adoption.
          </p>
        </div>
        <a 
          href="https://app.posthog.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium px-4 py-2 rounded-lg border border-indigo-500/20 transition-colors shrink-0"
        >
          Open PostHog native
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {POSTHOG_DASHBOARD_IFRAME_URL ? (
        <div className="w-full h-[800px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <iframe 
            src={POSTHOG_DASHBOARD_IFRAME_URL} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen 
            className="w-full h-full filter invert hue-rotate-180" // Quick hack for dark mode if PostHog dashboard is light
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Daily Active Users" 
            value="--" 
            trend="+0%" 
            icon={<Users className="w-5 h-5 text-indigo-400" />} 
          />
          <MetricCard 
            title="Conversion Rate" 
            value="--" 
            trend="+0%" 
            icon={<PieChart className="w-5 h-5 text-emerald-400" />} 
          />
          <MetricCard 
            title="Feature Adoption" 
            value="--" 
            trend="+0%" 
            icon={<BarChart3 className="w-5 h-5 text-amber-400" />} 
          />
          <MetricCard 
            title="Avg. Session Length" 
            value="--" 
            trend="+0%" 
            icon={<LineChart className="w-5 h-5 text-rose-400" />} 
          />

          <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-8 p-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Dashboard</h3>
            <p className="text-zinc-400 max-w-md text-sm mb-6 leading-relaxed">
              To view real-time metrics here, generate a Shared Dashboard Link in PostHog and set it as <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-300">POSTHOG_SHARED_DASHBOARD_URL</code> in your environment variables.
            </p>
            <a 
              href="https://posthog.com/docs/user-guides/dashboards#sharing-dashboards" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
            >
              Learn how to share dashboards <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-zinc-400">{title}</h4>
        <div className="p-2 bg-zinc-800 rounded-lg">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-xs font-medium text-zinc-500 mb-1">{trend}</span>
      </div>
    </div>
  );
}
