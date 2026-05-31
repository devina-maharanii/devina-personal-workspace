/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, User } from "lucide-react";

export interface UserUsagePoint {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  requests: number;
  tokens: number;
  cost: number;
}

interface TopUsersTableProps {
  data: UserUsagePoint[];
}

type SortField = "requests" | "tokens" | "cost";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 5;

export default function TopUsersTable({ data }: TopUsersTableProps) {
  const [sortField, setSortField] = useState<SortField>("requests");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Column Sorting Logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortField, sortDirection]);

  // Clientside Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-center items-center text-center py-20 select-none">
        <p className="text-sm font-semibold text-zinc-400">No User Usage Recorded</p>
        <p className="text-xs text-zinc-500 mt-1">Ensure team members are using AI models active in this workspace.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm space-y-6 select-none flex flex-col justify-between h-full">
      <div>
        <h3 className="font-semibold text-base text-white">Top Users Breakdown</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Review which workspace team members consume the largest shares of AI tokens.
        </p>
      </div>

      {/* Responsive Table Area */}
      <div className="overflow-x-auto -mx-6 sm:mx-0">
        <div className="inline-block min-w-full align-middle sm:px-0">
          <table className="min-w-full divide-y divide-zinc-850">
            <thead>
              <tr className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-left">
                <th scope="col" className="px-6 py-3.5">
                  Team Member
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("requests")}
                  className="px-6 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Requests</span>
                    <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("tokens")}
                  className="px-6 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tokens</span>
                    <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("cost")}
                  className="px-6 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Total Cost</span>
                    <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/60 text-xs">
              {paginatedData.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-950/20 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900 shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900 flex justify-center items-center shrink-0">
                          <User className="h-4 w-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">
                          {user.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate max-w-[120px] sm:max-w-[180px]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap font-semibold text-zinc-300">
                    {user.requests.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap font-semibold text-zinc-300">
                    {formatNumber(user.tokens)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap font-bold text-emerald-400">
                    ${user.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-850/60">
        <span className="text-xxs text-zinc-400">
          Showing Page {currentPage} of {totalPages} ({data.length} total)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white disabled:opacity-40 disabled:hover:text-zinc-400 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white disabled:opacity-40 disabled:hover:text-zinc-400 transition-all cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
