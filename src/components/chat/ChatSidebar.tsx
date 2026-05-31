"use client";

import { useState, useMemo } from "react";
import { useChatStore, ConversationItem } from "@/stores/chatStore";
import { isToday, isYesterday, subDays, isAfter, parseISO } from "date-fns";
import { Search, Plus, MessageSquare, Trash2, X } from "lucide-react";

interface ChatSidebarProps {
  onSelectMobileClose?: () => void;
  selectedModel: string;
}

export default function ChatSidebar({ onSelectMobileClose, selectedModel }: ChatSidebarProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
    deleteConversation,
  } = useChatStore();

  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );

    const groups: {
      today: ConversationItem[];
      yesterday: ConversationItem[];
      last7Days: ConversationItem[];
      older: ConversationItem[];
    } = {
      today: [],
      yesterday: [],
      last7Days: [],
      older: [],
    };

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    filtered.forEach((conv) => {
      const date = typeof conv.updatedAt === "string" ? parseISO(conv.updatedAt) : conv.updatedAt;
      if (isToday(date)) {
        groups.today.push(conv);
      } else if (isYesterday(date)) {
        groups.yesterday.push(conv);
      } else if (isAfter(date, sevenDaysAgo)) {
        groups.last7Days.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  }, [conversations, search]);

  const handleCreateChat = async () => {
    await createConversation(selectedModel);
    if (onSelectMobileClose) onSelectMobileClose();
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    if (onSelectMobileClose) onSelectMobileClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (deleteConfirmId === id) {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 w-80 shrink-0">
      {/* Action Header */}
      <div className="p-4 border-b border-zinc-900 space-y-4">
        <button
          onClick={handleCreateChat}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-indigo-600/10"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>

        {/* Search input bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-550" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-zinc-900 bg-zinc-900/30 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* History Stream List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {(["today", "yesterday", "last7Days", "older"] as const).map((groupKey) => {
          const list = groupedConversations[groupKey];
          if (list.length === 0) return null;

          const titleMap = {
            today: "Today",
            yesterday: "Yesterday",
            last7Days: "Last 7 Days",
            older: "Older",
          };

          return (
            <div key={groupKey} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-550">
                {titleMap[groupKey]}
              </h3>
              <div className="space-y-0.5">
                {list.map((c) => {
                  const isActive = activeConversationId === c.id;
                  const isConfirming = deleteConfirmId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-zinc-900 text-white border border-zinc-800"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-6">
                        <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-600"}`} />
                        <span className="text-xs truncate font-medium">{c.title}</span>
                      </div>

                      {/* Delete actions */}
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isConfirming ? (
                          <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800 rounded-lg shadow-xl">
                            <button
                              onClick={(e) => handleDelete(e, c.id)}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-red-650 hover:bg-red-500 rounded text-white"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-800 hover:bg-zinc-750 rounded text-zinc-400"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(c.id);
                            }}
                            className="p-1 rounded text-zinc-550 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {conversations.length === 0 && (
          <div className="text-center py-10 space-y-2">
            <MessageSquare className="h-8 w-8 text-zinc-800 mx-auto" />
            <p className="text-xs text-zinc-500">No conversations. Start a new one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
