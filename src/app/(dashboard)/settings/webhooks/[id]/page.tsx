import { requireAdmin, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import RedeliverButton from "./RedeliverButton";
import { notFound } from "next/navigation";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Webhook Deliveries | Settings",
  noIndex: true,
});

export default async function WebhookDetailsPage({ params }: { params: { id: string } }) {
  const user = await requireAdmin();
  const org = await getActiveOrg(user.id);

  const endpoint = await db.webhookEndpoint.findUnique({
    where: { id: params.id },
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!endpoint || endpoint.orgId !== org.id) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-4">
        <Link href="/settings/webhooks" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Webhooks
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight break-all">{endpoint.url}</h1>
          <div className="flex items-center gap-3 mt-2">
            {endpoint.active ? (
              <span className="text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded text-xs font-medium border border-emerald-400/20">Active</span>
            ) : (
              <span className="text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded text-xs font-medium border border-zinc-700">Disabled</span>
            )}
            <span className="text-zinc-500 text-sm">Secret: <code className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">{endpoint.secret.substring(0, 12)}...</code></span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-sm font-semibold text-white">Recent Deliveries</h2>
          <span className="text-xs text-zinc-500">Last 50 events</span>
        </div>
        
        {endpoint.deliveries.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No deliveries recorded yet. Use the Test endpoint button from the previous menu.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {endpoint.deliveries.map((delivery) => (
              <div key={delivery.id} className="p-4 sm:p-6 hover:bg-zinc-800/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {delivery.status === "SUCCESS" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : delivery.status === "FAILED" ? (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{delivery.event}</span>
                        {delivery.status === "FAILED" && delivery.attempts > 1 && (
                          <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Retry {delivery.attempts - 1}</span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{delivery.createdAt.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {delivery.status !== "SUCCESS" && (
                    <RedeliverButton deliveryId={delivery.id} />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Request Payload</h4>
                    <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-auto max-h-48 custom-scrollbar">
                      {JSON.stringify(delivery.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Response</h4>
                    <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-auto max-h-48 custom-scrollbar">
                      {delivery.response ? JSON.stringify(delivery.response, null, 2) : "No response data"}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
