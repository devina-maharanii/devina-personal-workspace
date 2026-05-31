/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import { updateOrganizationFeatures } from "@/lib/actions/admin";
import { 
  Settings, 
  Search, 
  CheckCircle, 
  Building,
  Save,
  Layers
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface OrgFeatureSettings {
  features?: Record<string, boolean> | string | null;
}

export interface OrgFeatureItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  settings?: OrgFeatureSettings | null;
}

interface FeaturesPageClientProps {
   
  initialOrgs: OrgFeatureItem[];
}

export function FeaturesPageClient({ initialOrgs }: FeaturesPageClientProps) {
  const [orgs, setOrgs] = useState<OrgFeatureItem[]>(initialOrgs);
  const [search, setSearch] = useState("");
   
  const [selectedOrg, setSelectedOrg] = useState<OrgFeatureItem | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({
    enableAiChat: false,
    enableAdvancedAnalytics: false,
    enableCustomDomain: false,
    enableWebhooks: false,
  });

  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

   
  const openConfigModal = (org: OrgFeatureItem) => {
    setSelectedOrg(org);
    const defaultFlags = {
      enableAiChat: false,
      enableAdvancedAnalytics: false,
      enableCustomDomain: false,
      enableWebhooks: false,
    };
    try {
      const dbFeatures = typeof org.settings?.features === "string"
        ? JSON.parse(org.settings.features)
        : org.settings?.features || {};
      setFeatures({ ...defaultFlags, ...dbFeatures });
    } catch {
      setFeatures(defaultFlags);
    }
  };

  const handleToggle = (flag: string) => {
    setFeatures(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const handleSaveOverrides = () => {
    if (!selectedOrg) return;
    setSuccessMsg("");
    startTransition(async () => {
      try {
        await updateOrganizationFeatures(selectedOrg.id, features);
        
        // Update local list state
        setOrgs(prev => prev.map(o => {
          if (o.id === selectedOrg.id) {
            return {
              ...o,
              settings: {
                ...o.settings,
                features: features
              }
            };
          }
          return o;
        }));

        setSuccessMsg(`Successfully overridden features for "${selectedOrg.name}".`);
        setSelectedOrg(null);
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to update overrides."));
      }
    });
  };

  return (
    <div className="space-y-8 text-white">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Feature Flags Console
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Toggle product feature enablers per plan globally or inject organization-specific feature flag overrides instantly.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <CheckCircle className="h-4.5 w-4.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Global Plan Defaults Dashboard */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" /> SaaS Billing Plan Defaults
          </h3>
          <p className="text-xs text-zinc-550 mt-1">
            These features are enabled automatically by default based on the pricing tier memberships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE Plan */}
          <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Free Tier Defaults</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xxs font-bold">Standard</span>
            </div>
            <div className="space-y-2.5 text-xs text-zinc-400">
              <div className="flex items-center justify-between opacity-50">
                <span>AI Chat Support</span>
                <span className="text-red-500 font-bold">Disabled</span>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <span>Advanced Analytics</span>
                <span className="text-red-500 font-bold">Disabled</span>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <span>Custom Domains Segment</span>
                <span className="text-red-500 font-bold">Disabled</span>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <span>Webhook Delivery</span>
                <span className="text-red-500 font-bold">Disabled</span>
              </div>
            </div>
          </div>

          {/* PRO Plan */}
          <div className="p-5 rounded-2xl bg-zinc-950/40 border border-indigo-950/20 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-16 w-16 rounded-full bg-indigo-500/5 blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pro Tier Defaults</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-850 text-indigo-400 text-xxs font-bold">Popular</span>
            </div>
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span>AI Chat Support</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Advanced Analytics</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Custom Domains Segment</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <span>Webhook Delivery</span>
                <span className="text-red-500 font-bold">Disabled</span>
              </div>
            </div>
          </div>

          {/* ENTERPRISE Plan */}
          <div className="p-5 rounded-2xl bg-zinc-950/40 border border-purple-950/20 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-16 w-16 rounded-full bg-purple-500/5 blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Enterprise Defaults</span>
              <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-850 text-purple-400 text-xxs font-bold">Full Package</span>
            </div>
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span>AI Chat Support</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Advanced Analytics</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Custom Domains Segment</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Webhook Delivery</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Feature Overrides Directory */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Building className="h-5 w-5 text-indigo-400" /> Custom Workspace Feature Overrides
            </h3>
            <p className="text-xs text-zinc-550 mt-1">
              Add individual overrides to organizations to grant features outside of their standard plan restrictions.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-950 focus:ring-1 focus:ring-indigo-900/40 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xxs font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Organization</th>
                <th className="pb-3 px-3">Billing Plan</th>
                <th className="pb-3 px-3">Active Overrides</th>
                <th className="pb-3 px-3 text-right">Configure</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-500 text-xs">
                    No active organizations found matching your search.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  let overrideCount = 0;
                  try {
                    const flags = typeof org.settings?.features === "string"
                      ? JSON.parse(org.settings.features)
                      : org.settings?.features || {};
                    overrideCount = Object.values(flags).filter(Boolean).length;
                  } catch {}

                  return (
                    <tr key={org.id} className="border-b border-zinc-800/40 text-zinc-300 hover:bg-zinc-800/10 transition-all">
                      <td className="py-4 px-3 font-semibold text-zinc-100 flex items-center gap-2">
                        {org.logo ? (
                          <img src={org.logo} alt={org.name} className="h-6 w-6 rounded object-cover ring-1 ring-zinc-700 bg-zinc-950" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-indigo-950/40 border border-indigo-850 flex items-center justify-center font-bold text-indigo-400 text-xxs">
                            <Building className="h-3 w-3" />
                          </div>
                        )}
                        <span>{org.name}</span>
                      </td>
                      <td className="py-4 px-3 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                          org.plan === "ENTERPRISE"
                            ? "bg-purple-950/30 text-purple-400"
                            : org.plan === "PRO"
                            ? "bg-indigo-950/30 text-indigo-400"
                            : "bg-zinc-800/40 text-zinc-555"
                        }`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xxs font-bold ${
                          overrideCount > 0 
                            ? "bg-amber-950/30 text-amber-400 border border-amber-800/20" 
                            : "bg-zinc-900 text-zinc-500"
                        }`}>
                          {overrideCount} flags enabled
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => openConfigModal(org)}
                          className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-750 rounded-xl text-xxs font-bold transition-all"
                        >
                          Configure Overrides
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Modal Overlay */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-6 shadow-2xl relative">
            
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-400" /> Feature Overrides
              </h4>
              <p className="text-xxs text-zinc-500 font-medium">
                Configure features overrides for organization "{selectedOrg.name}".
              </p>
            </div>

            <div className="space-y-3.5">
              {/* enableAiChat */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/20 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">AI Chat Interface</div>
                  <div className="text-xxs text-zinc-500">Permit custom chat tools</div>
                </div>
                <button
                  onClick={() => handleToggle("enableAiChat")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableAiChat ? "bg-indigo-500" : "bg-zinc-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableAiChat ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* enableAdvancedAnalytics */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/20 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">Advanced Analytics</div>
                  <div className="text-xxs text-zinc-500">Provide detailed charts</div>
                </div>
                <button
                  onClick={() => handleToggle("enableAdvancedAnalytics")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableAdvancedAnalytics ? "bg-indigo-500" : "bg-zinc-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableAdvancedAnalytics ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* enableCustomDomain */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/20 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">Custom Domains</div>
                  <div className="text-xxs text-zinc-500">Permit CNAME setups</div>
                </div>
                <button
                  onClick={() => handleToggle("enableCustomDomain")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableCustomDomain ? "bg-indigo-500" : "bg-zinc-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableCustomDomain ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* enableWebhooks */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/20 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">Webhook Endpoints</div>
                  <div className="text-xxs text-zinc-500">Permit external delivery logs</div>
                </div>
                <button
                  onClick={() => handleToggle("enableWebhooks")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableWebhooks ? "bg-indigo-500" : "bg-zinc-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableWebhooks ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedOrg(null)}
                className="flex-1 py-3 border border-zinc-850 hover:bg-zinc-900 rounded-2xl text-xs font-bold transition-all text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverrides}
                disabled={isPending}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save Override</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
