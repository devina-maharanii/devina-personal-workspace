/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  getAllUsers, 
  changeUserRole, 
  suspendUser, 
  deleteUser 
} from "@/lib/actions/admin";
import { UserRole } from "@prisma/client";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Eye, 
  UserCog, 
  Ban, 
  CheckCircle2, 
  Trash2,
  ArrowUpDown,
  RefreshCw,
  Users
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { getErrorMessage } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  plan: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: Date;
}

interface UsersPageClientProps {
   
  initialUsers: AdminUser[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function UsersPageClient({ initialUsers, initialPagination }: UsersPageClientProps) {
  // Client state
   
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [plan, setPlan] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // UI state
  const [_selectedUser, _setSelectedUser] = useState<unknown | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search debounce/trigger
  const fetchUsers = () => {
    startTransition(async () => {
      try {
        const result = await getAllUsers({
          page,
          limit: 10,
          search,
          role,
          plan,
          status,
          sortBy,
          sortOrder,
        });
        setUsers(result.users);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    });
  };

  // Trigger fetch when parameters change
  useEffect(() => {
    fetchUsers();
  }, [page, role, plan, status, sortBy, sortOrder]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Toggle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Change Role Action
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    setActiveMenuId(null);
    startTransition(async () => {
      try {
        await changeUserRole(userId, newRole);
        fetchUsers();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to update role"));
      }
    });
  };

  // Suspend/Unsuspend Action
  const handleSuspensionToggle = async (userId: string, isCurrentlySuspended: boolean) => {
    const actionText = isCurrentlySuspended ? "restore" : "suspend";
    if (!confirm(`Are you sure you want to ${actionText} this user's account?`)) return;
    setActiveMenuId(null);
    startTransition(async () => {
      try {
        await suspendUser(userId, !isCurrentlySuspended);
        fetchUsers();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to toggle suspension"));
      }
    });
  };

  // Delete Action
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to PERMANENTLY delete user ${userEmail}? This will erase all of their data, files, and Clerk profile. This action CANNOT be undone.`)) return;
    setActiveMenuId(null);
    startTransition(async () => {
      try {
        await deleteUser(userId);
        fetchUsers();
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to delete user"));
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            User Directory
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Search, filter, promote, suspend, or delete accounts across the entire application cluster.
          </p>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest bg-red-950/20 px-3 py-1.5 rounded-full border border-red-500/20">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing database...</span>
          </div>
        )}
      </div>

      {/* Interactive search and filters bar */}
      <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md gap-4 flex flex-col lg:flex-row lg:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, email, or Clerk ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-850 rounded-2xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-950 focus:ring-1 focus:ring-red-900/40 transition-all font-medium"
          />
        </form>

        {/* Filters panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
            <span>Role:</span>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="ALL">All</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
            <span>Plan:</span>
            <select
              value={plan}
              onChange={(e) => { setPlan(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="ALL">All</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
            <span>Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md overflow-hidden relative">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider select-none">
                <th className="pb-3 px-4 font-semibold">User</th>
                <th className="pb-3 px-4 font-semibold">
                  <button onClick={() => handleSort("email")} className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
                    <span>Email</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="pb-3 px-4 font-semibold">Role</th>
                <th className="pb-3 px-4 font-semibold">Plan</th>
                <th className="pb-3 px-4 font-semibold">Status</th>
                <th className="pb-3 px-4 font-semibold">
                  <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
                    <span>Joined At</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4">
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      description="No users matched your query or filter parameters. Try adjusting your search query or status filter."
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-zinc-800/40 text-zinc-300 hover:bg-zinc-800/10 transition-all group"
                  >
                    <td className="py-4 px-4 font-semibold text-zinc-100 flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name || "Avatar"} 
                          className="h-9 w-9 rounded-xl object-cover ring-1 ring-zinc-700 bg-zinc-950"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xs ring-1 ring-zinc-700">
                          {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{user.name || "Unnamed"}</span>
                    </td>
                    <td className="py-4 px-4 text-zinc-400 font-mono text-xs">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${
                        user.role === "ADMIN" 
                          ? "bg-red-950/30 text-red-400 border border-red-800/20" 
                          : "bg-zinc-800/40 text-zinc-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        user.plan.id === "enterprise"
                          ? "bg-purple-950/40 border border-purple-800/30 text-purple-400"
                          : user.plan.id === "pro"
                          ? "bg-red-950/40 border border-red-800/30 text-red-400"
                          : "bg-zinc-800/50 border border-zinc-700/30 text-zinc-400"
                      }`}>
                        {user.plan.name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                        user.status === "ACTIVE"
                          ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/20"
                          : "bg-red-950/30 text-red-400 border border-red-800/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        {/* Inspect link */}
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                          title="Inspect user details"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>

                        {/* Interactive operations drawer button */}
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                            className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                          >
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </button>

                          {activeMenuId === user.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] z-20">
                                <button
                                  onClick={() => handleRoleChange(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-colors"
                                >
                                  <UserCog className="h-4 w-4 text-zinc-400" />
                                  <span>{user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}</span>
                                </button>

                                <button
                                  onClick={() => handleSuspensionToggle(user.id, user.status === "SUSPENDED")}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                                    user.status === "SUSPENDED" 
                                      ? "text-emerald-400 hover:bg-emerald-950/20" 
                                      : "text-red-400 hover:bg-red-950/20"
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

                                <div className="h-px bg-zinc-905 my-1.5" />

                                <button
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-950/40 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete User</span>
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} users)
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
