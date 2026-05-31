/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getAuditLogs } from "@/lib/actions/admin";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  Terminal,
  Activity,
  User,
  Cpu,
  Globe,
  X,
  Copy,
  Check
} from "lucide-react";

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
   
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface AuditPageClientProps {
  initialLogs: AuditLog[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function AuditPageClient({ initialLogs, initialPagination }: AuditPageClientProps) {
  // Client state for filters & query
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // UI state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Distinct target types found in initial logs and common system models for quick filtering
  const targetTypes = ["ALL", "User", "ORGANIZATION", "SUBSCRIPTION", "Post", "API_KEY", "WEBHOOK"];

  // Fetch updated dataset
  const fetchLogs = () => {
    startTransition(async () => {
      try {
        const result = await getAuditLogs({
          page,
          limit,
          search,
          targetType,
          startDate,
          endDate,
        });
         
        setLogs(result.logs);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Failed to load audit logs:", error);
      }
    });
  };

  // Fetch logs whenever page, limit, type, or date boundaries change
  useEffect(() => {
    fetchLogs();
  }, [page, limit, targetType, startDate, endDate]);

  // Handle manual search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Copy metadata helper
   
  const handleCopyMetadata = (metadata: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export current dataset to CSV
  const handleExportCSV = () => {
    const headers = [
      "Timestamp", 
      "Log ID", 
      "Actor ID", 
      "Actor Name", 
      "Actor Email", 
      "Action", 
      "Target Type", 
      "Target ID", 
      "IP Address", 
      "Metadata"
    ];
    
    const rows = logs.map((log) => [
      log.createdAt,
      log.id,
      log.userId || "system",
      log.user?.name || "System Context",
      log.user?.email || "N/A",
      `"${log.action.replace(/"/g, '""')}"`,
      log.targetType,
      log.targetId || "N/A",
      log.ipAddress || "N/A",
      `"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary statistics for visual metric cards
  const systemCapturedCount = pagination.totalCount;
  const uniqueUsersInPage = new Set(logs.map((l) => l.userId).filter(Boolean)).size;
  const ipAddressesCount = new Set(logs.map((l) => l.ipAddress).filter(Boolean)).size;
  const mostActiveAction = logs.length > 0 
    ? logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : null;

  const topAction = mostActiveAction 
    ? Object.entries(mostActiveAction).sort((a, b) => b[1] - a[1])[0]?.[0]
    : "N/A";

  return (
    <div className="space-y-8">
      {/* Title & Headline */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Security Audit Logs
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Monitor real-time system actions, Stripe billing transactions, and administrative changes across the application cluster.
          </p>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest bg-red-950/20 px-3 py-1.5 rounded-full border border-red-500/20">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing database...</span>
          </div>
        )}
      </div>

      {/* Metrics Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Entries</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">{systemCapturedCount}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Captured security logs</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Active Actors</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <User className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">{uniqueUsersInPage}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Distinct users in current view</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">IP Addresses</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Globe className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">{ipAddressesCount}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Unique resolver endpoints</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Top Action</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-bold tracking-tight truncate" title={topAction}>
              {topAction.length > 25 ? `${topAction.slice(0, 22)}...` : topAction}
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5 font-medium">Most frequent security trigger</p>
          </div>
        </div>
      </div>

      {/* Action / Filter bar */}
      <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col gap-4">
        {/* Row 1: Search and CSV Export */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by action text, IP address, target ID, user ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-850 rounded-2xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-950 focus:ring-1 focus:ring-red-900/40 transition-all font-medium"
            />
          </form>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-3 w-full md:w-auto bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-2xl text-sm text-zinc-300 font-bold transition-all"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500" />
            <span>Export to CSV</span>
          </button>
        </div>

        {/* Row 2: Advanced filters panel */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-800/40">
          {/* Target Type Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-2 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span>Target Type:</span>
            <select
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            >
              {targetTypes.map((type) => (
                <option key={type} value={type} className="bg-zinc-950">
                  {type === "ALL" ? "All Targets" : type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-2 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            />
          </div>

          {/* Date Range End */}
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-2 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            />
          </div>

          {/* Limit / Page count selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-2 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-medium ml-auto">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value={10} className="bg-zinc-950">10 rows</option>
              <option value={25} className="bg-zinc-950">25 rows</option>
              <option value={50} className="bg-zinc-950">50 rows</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main logs explorer table */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md overflow-hidden relative">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider select-none">
                <th className="pb-3 px-4 font-semibold">Time</th>
                <th className="pb-3 px-4 font-semibold">Actor / User</th>
                <th className="pb-3 px-4 font-semibold">Action</th>
                <th className="pb-3 px-4 font-semibold">Target Entity</th>
                <th className="pb-3 px-4 font-semibold">IP Address</th>
                <th className="pb-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                    No security audit logs found matching your selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="border-b border-zinc-800/40 text-zinc-300 hover:bg-zinc-800/10 transition-all group"
                  >
                    {/* Timestamp */}
                    <td className="py-4 px-4 font-medium text-zinc-400 text-xs">
                      <div className="flex flex-col">
                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="text-zinc-500 font-normal mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>

                    {/* Actor User */}
                    <td className="py-4 px-4">
                      {log.userId ? (
                        log.user ? (
                          <div className="flex items-center gap-2.5">
                            {log.user.avatarUrl ? (
                              <img 
                                src={log.user.avatarUrl} 
                                alt={log.user.name || "Avatar"} 
                                className="h-7 w-7 rounded-lg object-cover ring-1 ring-zinc-700 bg-zinc-950"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-lg bg-zinc-850 flex items-center justify-center font-bold text-zinc-400 text-[10px] ring-1 ring-zinc-700">
                                {log.user.name ? log.user.name.slice(0, 2).toUpperCase() : log.user.email.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <Link 
                                href={`/admin/users/${log.userId}`} 
                                className="font-semibold text-zinc-200 hover:text-white transition-colors hover:underline text-xs"
                              >
                                {log.user.name || "Unnamed"}
                              </Link>
                              <span className="text-[10px] text-zinc-500 font-mono">{log.user.email}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-zinc-300 font-semibold text-xs">User ID Match</span>
                            <span className="text-[10px] text-zinc-500 font-mono select-all">{log.userId}</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-500 font-semibold text-xs">
                          <Cpu className="h-4 w-4 text-zinc-600" />
                          <span>System Context</span>
                        </div>
                      )}
                    </td>

                    {/* Action Text */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        log.action.includes("failed") || log.action.includes("unauthorized") || log.action.includes("delete")
                          ? "bg-red-950/30 text-red-400 border border-red-800/10"
                          : log.action.includes("success") || log.action.includes("create")
                          ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/10"
                          : "bg-zinc-800/50 border border-zinc-750 text-zinc-300"
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Target Entity */}
                    <td className="py-4 px-4 text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                          {log.targetType}
                        </span>
                        {log.targetId && (
                          <span className="font-mono text-zinc-500 mt-0.5 select-all overflow-hidden text-ellipsis max-w-[150px]" title={log.targetId}>
                            {log.targetId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                      {log.ipAddress || "system-context"}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all inline-flex items-center gap-1 text-xs font-semibold"
                        title="View Detailed Payload Metadata"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Payload</span>
                      </button>
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} entries)
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

      {/* Premium JSON Metadata Drawer Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0" 
            onClick={() => setSelectedLog(null)}
          />
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl p-6 relative z-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-5 w-5 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Metadata Payload</h3>
                  <span className="text-[10px] font-mono text-zinc-500">{selectedLog.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* Event details summary */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-zinc-500 font-semibold block">Action</span>
                  <span className="text-zinc-300 font-bold mt-1 block">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-semibold block">Timestamp</span>
                  <span className="text-zinc-300 font-semibold mt-1 block">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 font-semibold block">Actor</span>
                  <span className="text-zinc-300 font-mono mt-1 block truncate">
                    {selectedLog.user?.email || "system-context"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 font-semibold block">Client IP Address</span>
                  <span className="text-zinc-300 font-mono mt-1 block">
                    {selectedLog.ipAddress || "N/A"}
                  </span>
                </div>
              </div>

              {/* JSON code block */}
              <div className="relative">
                <div className="absolute right-3 top-3 z-20">
                  <button
                    onClick={() => handleCopyMetadata(selectedLog.metadata)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                
                <pre className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl overflow-x-auto text-[11px] font-mono text-zinc-300 leading-relaxed max-h-[40vh]">
                  <code>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
