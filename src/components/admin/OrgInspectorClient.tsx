/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  updateOrganizationFeatures, 
  changeOrganizationPlan, 
  deleteOrganization 
} from "@/lib/actions/admin";
import { 
  Building2, 
  Users, 
  HardDrive, 
  BrainCircuit, 
  ChevronLeft, 
  Settings, 
  ShieldAlert, 
  CheckCircle,
  Save,
  Trash2,
  Activity
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface OrgMemberItem {
  id: string;
  role: string;
  joinedAt: string | Date;
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface OrgInspectorData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  maxMembers: number | null;
  filesCount: number;
  storageUsedBytes: number;
  aiUsageThisMonth: {
    requestsCount: number;
    totalTokens: number;
    cost: number;
  };
  settings?: {
    features?: Record<string, boolean> | string | null;
  } | null;
  members: OrgMemberItem[];
}

interface OrgInspectorClientProps {
   
  org: OrgInspectorData;
}

export function OrgInspectorClient({ org }: OrgInspectorClientProps) {
  // Client state
  const [activePlan, setActivePlan] = useState(org.plan);
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
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
      return { ...defaultFlags, ...dbFeatures };
    } catch {
      return defaultFlags;
    }
  });

  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");

  // Storage calculation in GB
  const storageGB = org.storageUsedBytes / (1024 * 1024 * 1024);

  // Toggle flags
  const handleFeatureToggle = (flagName: string) => {
    setFeatures((prev) => ({
      ...prev,
      [flagName]: !prev[flagName],
    }));
  };

  // Save Features Override Action
  const handleSaveFeatures = () => {
    setSuccessMsg("");
    startTransition(async () => {
      try {
        await updateOrganizationFeatures(org.id, features);
        setSuccessMsg("Feature overrides saved successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to update feature overrides."));
      }
    });
  };

  // Change Plan Action
  const handlePlanChange = (newPlan: string) => {
    if (!confirm(`Are you sure you want to change this organization's plan tier to ${newPlan}?`)) return;
    startTransition(async () => {
      try {
        await changeOrganizationPlan(org.id, newPlan);
        setActivePlan(newPlan);
        setSuccessMsg(`Plan successfully updated to ${newPlan}.`);
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to update plan."));
      }
    });
  };

  // Delete Action
  const handleDeleteOrg = async () => {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to PERMANENTLY delete organization "${org.name}"? This deletes all memberships, files, webhooks, and settings from the database. This action cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteOrganization(org.id);
        window.location.href = "/admin/organizations";
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to delete organization."));
      }
    });
  };

  return (
    <div className="space-y-8 text-white max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link 
          href="/admin/organizations" 
          className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to organizations</span>
        </Link>

        {successMsg && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <CheckCircle className="h-4.5 w-4.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Hero Badge card */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          {org.logo ? (
            <img 
              src={org.logo} 
              alt={org.name} 
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-zinc-700 bg-zinc-950"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-indigo-950/30 border border-indigo-850 flex items-center justify-center font-bold text-indigo-400">
              <Building2 className="h-8 w-8" />
            </div>
          )}
          
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{org.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-400 font-mono">ID: {org.id}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-750" />
              <span className="text-xs text-zinc-400 font-mono">Slug: {org.slug}</span>
            </div>
          </div>
        </div>

        {/* Plan badge & controls */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xxs font-bold text-zinc-500 uppercase tracking-widest">Active Plan</div>
            <div className="text-sm font-extrabold text-indigo-400">{activePlan}</div>
          </div>
          
          <select
            value={activePlan}
            disabled={isPending}
            onChange={(e) => handlePlanChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-550 cursor-pointer"
          >
            <option value="FREE">Free Tier</option>
            <option value="PRO">Pro Tier</option>
            <option value="ENTERPRISE">Enterprise Tier</option>
          </select>
        </div>
      </div>

      {/* Statistics counters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Members */}
        <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Members Seats</span>
            <Users className="h-4.5 w-4.5 text-zinc-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{org.members.length}</div>
            <p className="text-xxs text-zinc-500 mt-1">Occupied of max {org.maxMembers || 5} limits</p>
          </div>
        </div>

        {/* AI Credit Requests */}
        <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">AI Operations (MTD)</span>
            <BrainCircuit className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{org.aiUsageThisMonth.requestsCount}</div>
            <p className="text-xxs text-zinc-500 mt-1">Summing {org.aiUsageThisMonth.totalTokens.toLocaleString()} tokens</p>
          </div>
        </div>

        {/* AI Cost */}
        <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">AI Costs (MTD)</span>
            <Activity className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">${org.aiUsageThisMonth.cost.toFixed(4)}</div>
            <p className="text-xxs text-zinc-500 mt-1">Calculated token costs</p>
          </div>
        </div>

        {/* Storage */}
        <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Storage Usage</span>
            <HardDrive className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{storageGB.toFixed(4)} GB</div>
            <p className="text-xxs text-zinc-500 mt-1">Total {org.filesCount} uploads inside storage</p>
          </div>
        </div>
      </div>

      {/* Dynamic Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Members Roster List */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" /> Active Workspace Members
          </h3>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xxs font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Member</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {org.members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500 text-xs">
                      No active members found.
                    </td>
                  </tr>
                ) : (
                   
                  org.members.map((m) => (
                    <tr key={m.id} className="border-b border-zinc-800/40 text-zinc-300 hover:bg-zinc-800/10 transition-all">
                      <td className="py-3 px-3 font-semibold text-zinc-100 flex items-center gap-2.5">
                        {m.user.avatarUrl ? (
                          <img 
                            src={m.user.avatarUrl} 
                            alt={m.user.name || "Avatar"} 
                            className="h-7 w-7 rounded-lg object-cover ring-1 ring-zinc-700 bg-zinc-950"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xxs ring-1 ring-zinc-700">
                            {m.user.name ? m.user.name.slice(0, 2).toUpperCase() : m.user.email.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span>{m.user.name || "N/A"}</span>
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono text-xs">{m.user.email}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xxs font-bold ${
                          m.role === "OWNER" 
                            ? "bg-amber-950/30 text-amber-400 border border-amber-800/20" 
                            : m.role === "ADMIN" 
                            ? "bg-red-950/30 text-red-400 border border-red-800/20" 
                            : "bg-zinc-800/40 text-zinc-400"
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-zinc-550 text-xs">
                        {new Date(m.joinedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Flags Override Block */}
        <div className="lg:col-span-1 space-y-6 flex flex-col justify-between">
          <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-400" /> Feature Flags Override
              </h3>
              <p className="text-xxs text-zinc-450 mt-1 font-medium">
                Set plan-independent feature toggles that take effect instantly for this workspace.
              </p>
            </div>

            <div className="space-y-4">
              {/* enableAiChat */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/40 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">AI Chat Interface</div>
                  <div className="text-xxs text-zinc-500">Enable advanced custom chats</div>
                </div>
                <button
                  onClick={() => handleFeatureToggle("enableAiChat")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableAiChat ? "bg-indigo-500" : "bg-zinc-850"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableAiChat ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* enableAdvancedAnalytics */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/40 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">Advanced Analytics</div>
                  <div className="text-xxs text-zinc-500">Access detailed charts</div>
                </div>
                <button
                  onClick={() => handleFeatureToggle("enableAdvancedAnalytics")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableAdvancedAnalytics ? "bg-indigo-500" : "bg-zinc-850"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableAdvancedAnalytics ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* enableCustomDomain */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/40 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">Custom Domains</div>
                  <div className="text-xxs text-zinc-500">CNAME domain attachments</div>
                </div>
                <button
                  onClick={() => handleFeatureToggle("enableCustomDomain")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableCustomDomain ? "bg-indigo-500" : "bg-zinc-850"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableCustomDomain ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* enableWebhooks */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/40 border border-zinc-900">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">Webhook Endpoints</div>
                  <div className="text-xxs text-zinc-500">HTTP delivery event streams</div>
                </div>
                <button
                  onClick={() => handleFeatureToggle("enableWebhooks")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.enableWebhooks ? "bg-indigo-500" : "bg-zinc-850"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.enableWebhooks ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveFeatures}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Save Override Toggles</span>
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-6 rounded-3xl border border-zinc-800 bg-red-950/10 border-red-900/20 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5" /> Dangerous Actions
              </h4>
              <p className="text-xxs text-zinc-450 mt-1 font-medium">
                Administrative commands that perform irreversible mutations. Use caution.
              </p>
            </div>

            <button
              onClick={handleDeleteOrg}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-red-900/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>Prune & Delete Workspace</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
