import { requireAdmin, getActiveOrg } from "@/lib/auth";
import { ArrowRight, MessageSquare, Zap, Activity, Workflow } from "lucide-react";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Native Integrations | Settings",
  noIndex: true,
});

export default async function IntegrationsPage() {
  const user = await requireAdmin();
  const _org = await getActiveOrg(user.id);

  const integrations = [
    {
      id: "slack",
      name: "Slack",
      description: "Send notifications to Slack channels when important events occur in your workspace.",
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      status: "Available",
      actionText: "Connect Slack",
      href: "#"
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect your workspace to 5,000+ apps. Use our webhooks to trigger Zapier workflows automatically.",
      icon: Zap,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      status: "Available",
      actionText: "Setup Webhook",
      href: "/settings/webhooks"
    },
    {
      id: "make",
      name: "Make (Integromat)",
      description: "Visually create, build and automate workflows without limits. Trigger Make scenarios instantly.",
      icon: Activity,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      status: "Available",
      actionText: "Setup Webhook",
      href: "/settings/webhooks"
    },
    {
      id: "n8n",
      name: "n8n",
      description: "Fair-code workflow automation tool. Receive events locally or on n8n Cloud via generic webhook triggers.",
      icon: Workflow,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      status: "Available",
      actionText: "Setup Webhook",
      href: "/settings/webhooks"
    }
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Integrations</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Connect your workspace with your favorite tools and automate your workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div key={integration.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${integration.bg}`}>
                  <Icon className={`w-6 h-6 ${integration.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {integration.name}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {integration.status}
                    </span>
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                    {integration.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-zinc-800/50 flex justify-end">
                <Link 
                  href={integration.href}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group"
                >
                  {integration.actionText}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
