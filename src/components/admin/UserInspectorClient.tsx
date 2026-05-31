/* eslint-disable @next/next/no-img-element */
"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  changeUserRole, 
  suspendUser, 
  deleteUser 
} from "@/lib/actions/admin";
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  CreditCard, 
  Building2, 
  FileText, 
  Cpu, 
  Terminal, 
  UserCog, 
  Ban, 
  CheckCircle2, 
  Trash2, 
  UserSquare2,
  Download,
  ShieldCheck
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface UserPlan {
  id: string;
  name: string;
  price: number;
}

interface UserMembership {
  id: string;
  role: string;
  organization: {
    name: string;
    slug: string;
    logo: string | null;
  };
}

interface UserFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

interface UserAiLog {
  id: string;
  createdAt: string | Date;
  feature: string;
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

interface UserAuditLog {
  id: string;
  createdAt: string | Date;
  action: string;
  targetType: string;
  targetId: string | null;
  ipAddress: string | null;
  user: {
    name: string | null;
    email: string;
  } | null;
}

interface AdminUserDetails {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  clerkId: string;
  createdAt: string | Date;
  plan: UserPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string;
  currentPeriodEnd: string | Date | null;
  memberships: UserMembership[];
  files: UserFile[];
  aiUsageLogs: UserAiLog[];
  auditLogs: UserAuditLog[];
}

interface UserInspectorClientProps {
   
  user: AdminUserDetails;
}

export function UserInspectorClient({ user }: UserInspectorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Role Action
  const handleRoleChange = async () => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    startTransition(async () => {
      try {
        await changeUserRole(user.id, newRole);
        router.refresh();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to update role"));
      }
    });
  };

  // Suspension Action
  const handleSuspensionToggle = async () => {
    const isSuspended = user.status === "SUSPENDED";
    const actionText = isSuspended ? "restore" : "suspend";
    if (!confirm(`Are you sure you want to ${actionText} this user's account?`)) return;
    startTransition(async () => {
      try {
        await suspendUser(user.id, !isSuspended);
        router.refresh();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to toggle suspension"));
      }
    });
  };

  // Delete Action
  const handleDeleteUser = async () => {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to PERMANENTLY delete user ${user.email}? This will erase all of their data, files, and Clerk profile. This action CANNOT be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteUser(user.id);
        router.push("/admin/users");
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to delete user"));
      }
    });
  };

  // Impersonate Action
  const handleImpersonate = () => {
    alert(
      `📌 IMPERSONATE PROTOCOL ACTIVATED:\n\nTo impersonate user "${user.name || user.email}" (Clerk ID: ${user.clerkId}):\n\n1. Copy their Clerk ID.\n2. In Clerk Dashboard under User Management, select this user and click "Impersonate Session".\n\n(Production logs will record this action to the AuditLog).`
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <Link 
          href="/admin/users" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all text-sm font-medium"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to Directory</span>
        </Link>

        {/* Quick Operations toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleImpersonate}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/35 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all disabled:opacity-50"
          >
            <UserSquare2 className="h-4 w-4 text-zinc-400" />
            <span>Impersonate (Clerk)</span>
          </button>

          <button
            onClick={handleRoleChange}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/35 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all disabled:opacity-50"
          >
            <UserCog className="h-4 w-4 text-zinc-400" />
            <span>{user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}</span>
          </button>

          <button
            onClick={handleSuspensionToggle}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/35 hover:bg-zinc-850 text-xs font-bold transition-all disabled:opacity-50 ${
              user.status === "SUSPENDED" 
                ? "text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/20" 
                : "text-red-400 border-red-900/30 hover:bg-red-950/20"
            }`}
          >
            {user.status === "SUSPENDED" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Unsuspend / Restore</span>
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                <span>Suspend Account</span>
              </>
            )}
          </button>

          <button
            onClick={handleDeleteUser}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-900/40 hover:bg-red-900/30 text-xs font-bold text-red-400 transition-all disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>

      {/* Profile & Subscription Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* General Profile Card */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name || "User Avatar"} 
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-zinc-700 bg-zinc-950"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xl ring-2 ring-zinc-700">
                {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>{user.name || "Unnamed User"}</span>
                {user.role === "ADMIN" && (
                  <span title="Super Administrator">
                    <ShieldCheck className="h-5 w-5 text-red-500" />
                  </span>
                )}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold mt-1 ${
                user.status === "ACTIVE"
                  ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/20"
                  : "bg-red-950/30 text-red-400 border border-red-800/20"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                }`} />
                {user.status}
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-850 pt-5 space-y-4 text-sm font-medium">
            <div className="flex items-center justify-between py-1 border-b border-zinc-850/50">
              <span className="text-zinc-500">Database ID</span>
              <span className="text-zinc-300 font-mono text-xs select-all">{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-850/50">
              <span className="text-zinc-500">Clerk ID</span>
              <span className="text-zinc-300 font-mono text-xs select-all">{user.clerkId}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-850/50">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>Email Address</span>
              </span>
              <span className="text-zinc-300 font-mono text-xs select-all">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Registered Date</span>
              </span>
              <span className="text-zinc-300">
                {new Date(user.createdAt).toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription details Card */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-bold text-zinc-100">Subscription & Billing</h3>
          </div>

          <div className="flex items-center justify-between bg-zinc-950/40 p-4 border border-zinc-850 rounded-2xl">
            <div>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Current Plan</span>
              <h4 className="text-lg font-extrabold text-zinc-100 mt-1">{user.plan.name} Plan</h4>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
              user.plan.id === "enterprise"
                ? "bg-purple-950/40 border border-purple-800/30 text-purple-400 animate-pulse"
                : user.plan.id === "pro"
                ? "bg-red-950/40 border border-red-800/30 text-red-400"
                : "bg-zinc-800/50 border border-zinc-700/30 text-zinc-400"
            }`}>
              {user.plan.price > 0 ? `$${user.plan.price}/mo` : "Free"}
            </span>
          </div>

          <div className="space-y-4 text-sm font-medium">
            <div className="flex items-center justify-between py-1 border-b border-zinc-850/50">
              <span className="text-zinc-500">Stripe Customer ID</span>
              <span className="text-zinc-300 font-mono text-xs select-all">
                {user.stripeCustomerId || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-850/50">
              <span className="text-zinc-500">Stripe Subscription ID</span>
              <span className="text-zinc-300 font-mono text-xs select-all">
                {user.stripeSubscriptionId || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-850/50">
              <span className="text-zinc-500">Subscription Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                user.subscriptionStatus === "ACTIVE" 
                  ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/20" 
                  : "bg-zinc-800/40 text-zinc-400"
              }`}>
                {user.subscriptionStatus}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-500">Billing Period End</span>
              <span className="text-zinc-300">
                {user.currentPeriodEnd 
                  ? new Date(user.currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations & Uploaded files Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Organizations memberships card */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-bold text-zinc-100">Associated Organizations</h3>
          </div>

          <div className="space-y-3">
            {user.memberships.length === 0 ? (
              <p className="text-sm text-zinc-500 font-medium">This user is not a member of any organization.</p>
            ) : (
               
              user.memberships.map((membership) => (
                <div 
                  key={membership.id}
                  className="flex items-center justify-between p-4 border border-zinc-850/50 bg-zinc-950/40 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    {membership.organization.logo ? (
                      <img 
                        src={membership.organization.logo} 
                        alt={membership.organization.name} 
                        className="h-9 w-9 rounded-xl object-cover ring-1 ring-zinc-850"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-xl bg-zinc-800 flex items-center justify-center font-extrabold text-xs text-zinc-400 ring-1 ring-zinc-850">
                        {membership.organization.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{membership.organization.name}</h4>
                      <p className="text-xs text-zinc-500 font-medium font-mono">slug: {membership.organization.slug}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    membership.role === "OWNER" 
                      ? "bg-red-950/20 text-red-400 border border-red-900/20" 
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {membership.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Uploaded Files Repository */}
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-bold text-zinc-100">Uploaded Files Repository</h3>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {user.files.length === 0 ? (
              <p className="text-sm text-zinc-500 font-medium">No files uploaded by this user.</p>
            ) : (
               
              user.files.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3.5 border border-zinc-850/50 bg-zinc-950/30 rounded-2xl text-xs font-medium text-zinc-300"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h4 className="truncate font-bold text-zinc-200" title={file.name}>{file.name}</h4>
                    <p className="text-zinc-500 mt-0.5 font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimeType}
                    </p>
                  </div>

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI usage completions statistics logs */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-red-400" />
          <h3 className="text-lg font-bold text-zinc-100">Recent AI Usage Logs (Last 50 requests)</h3>
        </div>

        <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider pb-2">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Feature</th>
                <th className="pb-3 px-3">Model</th>
                <th className="pb-3 px-3">Tokens Used</th>
                <th className="pb-3 px-3 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {user.aiUsageLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-500 font-medium">
                    No artificial intelligence activity recorded.
                  </td>
                </tr>
              ) : (
                 
                user.aiUsageLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-850/40 text-zinc-300 hover:bg-zinc-800/10">
                    <td className="py-3 px-3 font-mono text-zinc-500">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-850 font-bold text-zinc-400">
                        {log.feature}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400">{log.model}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-400">
                      {log.totalTokens.toLocaleString()} <span className="text-zinc-600 font-normal">({log.promptTokens} in / {log.completionTokens} out)</span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-red-400 font-mono">
                      ${log.cost.toFixed(5)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Entries related to this user */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-red-400" />
          <h3 className="text-lg font-bold text-zinc-100">AuditLog Chronicle</h3>
        </div>

        <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider pb-2">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Action</th>
                <th className="pb-3 px-3">Target Entity</th>
                <th className="pb-3 px-3">Actor / Admin</th>
                <th className="pb-3 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {user.auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-500 font-medium">
                    No related administrative logs.
                  </td>
                </tr>
              ) : (
                 
                user.auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-850/40 text-zinc-300 hover:bg-zinc-800/10">
                    <td className="py-3.5 px-3 font-mono text-zinc-500">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-zinc-200">
                      <span className="bg-zinc-950 border border-zinc-850 rounded px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-zinc-400">
                      {log.targetType} ({log.targetId || "N/A"})
                    </td>
                    <td className="py-3.5 px-3 font-medium">
                      {log.user ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-300">{log.user.name || log.user.email}</span>
                          <span className="text-zinc-500 text-[10px]">({log.user.email})</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">SYSTEM / WEBHOOK</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-zinc-500">{log.ipAddress || "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
