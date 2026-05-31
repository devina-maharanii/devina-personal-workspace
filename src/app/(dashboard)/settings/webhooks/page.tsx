import { requireAdmin, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { Webhook, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import WebhookActions from "./WebhookActions";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Webhooks | Settings",
  noIndex: true,
});

export default async function WebhooksPage() {
  const user = await requireAdmin();
  const org = await getActiveOrg(user.id);

  const endpoints = await db.webhookEndpoint.findMany({
    where: { orgId: org.id },
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Webhooks</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Configure external endpoints to receive real-time organization events.
          </p>
        </div>
        <WebhookActions action="create" />
      </div>

      {endpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
            <Webhook className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No webhooks configured</h3>
          <p className="text-zinc-400 text-sm mb-6 text-center max-w-sm">
            Send events to your own servers or automation tools like Zapier and Make when things happen.
          </p>
          <WebhookActions action="create" buttonStyle="primary" />
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Endpoint URL</th>
                <th className="px-6 py-4 font-medium">Events</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Delivery</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {endpoints.map((endpoint) => {
                const lastDelivery = endpoint.deliveries[0];
                return (
                  <tr key={endpoint.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-300">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${endpoint.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                        <Link href={`/settings/webhooks/${endpoint.id}`} className="hover:text-indigo-400 hover:underline">
                          {endpoint.url}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {endpoint.events.map((e) => (
                          <span key={e} className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {endpoint.active ? (
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs font-medium">Active</span>
                      ) : (
                        <span className="text-zinc-400 bg-zinc-800 px-2 py-1 rounded text-xs font-medium">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lastDelivery ? (
                        <div className="flex items-center gap-2 text-zinc-400">
                          {lastDelivery.status === 'SUCCESS' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span className="text-xs">
                            {lastDelivery.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <WebhookActions action="menu" endpointId={endpoint.id} active={endpoint.active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
