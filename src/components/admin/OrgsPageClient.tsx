/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  getAllOrganizations, 
  changeOrganizationPlan, 
  deleteOrganization 
} from "@/lib/actions/admin";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Eye, 
  Building2, 
  Trash2,
  RefreshCw,
  Award
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { getErrorMessage } from "@/lib/utils";

interface OrgListItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  createdAt: string | Date;
  membersCount: number;
}

interface OrgsPageClientProps {
   
  initialOrgs: OrgListItem[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function OrgsPageClient({ initialOrgs, initialPagination }: OrgsPageClientProps) {
  // Client state
   
  const [orgs, setOrgs] = useState<OrgListItem[]>(initialOrgs);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("ALL");
  const [page, setPage] = useState(1);

  // UI state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load organizations based on params
  const fetchOrgs = () => {
    startTransition(async () => {
      try {
        const result = await getAllOrganizations({
          page,
          limit: 10,
          search,
          plan,
        });
        setOrgs(result.organizations);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Failed to load organizations:", error);
      }
    });
  };

  // Trigger load when filters/pages change
  useEffect(() => {
    fetchOrgs();
  }, [page, plan]);

  // Search handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrgs();
  };

  // Change Plan Action
  const handlePlanChange = async (orgId: string, newPlan: string) => {
    if (!confirm(`Are you sure you want to change this organization's plan tier to ${newPlan}?`)) return;
    setActiveMenuId(null);
    startTransition(async () => {
      try {
        await changeOrganizationPlan(orgId, newPlan);
        fetchOrgs();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to update organization plan."));
      }
    });
  };

  // Delete Action
  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to PERMANENTLY delete the organization "${orgName}"? All workspaces, blog posts, configurations, and settings will be pruned. This action is irreversible!`)) return;
    setActiveMenuId(null);
    startTransition(async () => {
      try {
        await deleteOrganization(orgId);
        fetchOrgs();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to delete organization."));
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Organization Directory
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Inspect workspaces, modify service quotas, shift billing tiers, or tear down organization clusters.
          </p>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/20 px-3 py-1.5 rounded-full border border-indigo-500/20">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing database...</span>
          </div>
        )}
      </div>

      {/* Control Filters Bar */}
      <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md gap-4 flex flex-col lg:flex-row lg:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search organizations by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-850 rounded-2xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-950 focus:ring-1 focus:ring-indigo-900/40 transition-all font-medium"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
            <span>Filter Plan:</span>
            <select
              value={plan}
              onChange={(e) => { setPlan(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid/Table */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md overflow-hidden relative">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider select-none">
                <th className="pb-3 px-4 font-semibold">Logo / Workspace</th>
                <th className="pb-3 px-4 font-semibold">Slug Identifier</th>
                <th className="pb-3 px-4 font-semibold">Active Plan</th>
                <th className="pb-3 px-4 font-semibold">Members Count</th>
                <th className="pb-3 px-4 font-semibold">Created At</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4">
                    <EmptyState
                      icon={Building2}
                      title="No organizations found"
                      description="No organizations matched your parameters. Try modifying your search term or filtering options."
                    />
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr 
                    key={org.id} 
                    className="border-b border-zinc-800/40 text-zinc-300 hover:bg-zinc-800/10 transition-all group"
                  >
                    <td className="py-4 px-4 font-semibold text-zinc-100 flex items-center gap-3">
                      {org.logo ? (
                        <img 
                          src={org.logo} 
                          alt={org.name} 
                          className="h-9 w-9 rounded-xl object-cover ring-1 ring-zinc-700 bg-zinc-950"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-indigo-950/40 border border-indigo-850 flex items-center justify-center font-bold text-indigo-400 text-xs">
                          <Building2 className="h-4.5 w-4.5" />
                        </div>
                      )}
                      <span>{org.name}</span>
                    </td>
                    <td className="py-4 px-4 text-zinc-450 font-mono text-xs">{org.slug}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        org.plan === "ENTERPRISE"
                          ? "bg-purple-950/40 border border-purple-800/30 text-purple-400"
                          : org.plan === "PRO"
                          ? "bg-indigo-950/40 border border-indigo-800/30 text-indigo-400"
                          : "bg-zinc-800/50 border border-zinc-700/30 text-zinc-450"
                      }`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-zinc-300">
                      {org.membersCount} <span className="text-zinc-500 font-normal">members</span>
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-500 text-xs">
                      {new Date(org.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                          title="View workspace dashboard details"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === org.id ? null : org.id)}
                            className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                          >
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </button>

                          {activeMenuId === org.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] z-20">
                                <span className="block px-3 py-1.5 text-xxs font-bold text-zinc-500 uppercase tracking-widest">
                                  Shift Plan Tier
                                </span>
                                
                                <button
                                  disabled={org.plan === "FREE"}
                                  onClick={() => handlePlanChange(org.id, "FREE")}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 disabled:opacity-30 transition-colors"
                                >
                                  <Award className="h-4 w-4 text-zinc-500" />
                                  <span>Downgrade to Free</span>
                                </button>
                                
                                <button
                                  disabled={org.plan === "PRO"}
                                  onClick={() => handlePlanChange(org.id, "PRO")}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 disabled:opacity-30 transition-colors"
                                >
                                  <Award className="h-4 w-4 text-indigo-400" />
                                  <span>Upgrade to Pro</span>
                                </button>

                                <button
                                  disabled={org.plan === "ENTERPRISE"}
                                  onClick={() => handlePlanChange(org.id, "ENTERPRISE")}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 disabled:opacity-30 transition-colors"
                                >
                                  <Award className="h-4 w-4 text-purple-400" />
                                  <span>Upgrade to Enterprise</span>
                                </button>

                                <div className="h-px bg-zinc-900 my-1.5" />

                                <button
                                  onClick={() => handleDeleteOrg(org.id, org.name)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-950/40 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete Workspace</span>
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

        {/* Pagination Toolbar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/40 text-xs text-zinc-500 font-medium">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} organizations)
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
