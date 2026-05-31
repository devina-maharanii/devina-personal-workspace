/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
 
"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useUIStore } from "@/stores/uiStore";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  Search,
  Sun,
  Sparkles,
  FileText,
  User,
  MessageSquare,
  UploadCloud,
  FileEdit,
  Building,
  Bug,
  History,
  Download,
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SearchPost {
  id: string;
  title: string;
  published: boolean;
}

interface SearchMember {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface SearchFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

interface SearchResults {
  posts: SearchPost[];
  members: SearchMember[];
  files: SearchFile[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { commandPaletteOpen, closeCommandPalette, openCommandPalette } = useUIStore();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const [recentSearches, setRecentSearches] = useState<{ path: string; label: string; icon: string }[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (_e) {
      // Ignore
    }
  }, [commandPaletteOpen]);

  const saveRecent = (path: string, label: string, icon: string) => {
    try {
      const current = [...recentSearches];
      const existingIdx = current.findIndex(r => r.path === path);
      if (existingIdx >= 0) current.splice(existingIdx, 1);
      
      current.unshift({ path, label, icon });
      const newRecents = current.slice(0, 5);
      setRecentSearches(newRecents);
      localStorage.setItem("recentSearches", JSON.stringify(newRecents));
    } catch (_e) {
      // Ignore
    }
  };

  const { data: searchResults, isLoading } = useSWR<SearchResults>(
    debouncedQuery.length > 1 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (commandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, openCommandPalette, closeCommandPalette]);

  if (!commandPaletteOpen) return null;

  const runCommand = (action: () => void, path?: string, label?: string, icon?: string) => {
    if (path && label && icon) {
      saveRecent(path, label, icon);
    }
    action();
    closeCommandPalette();
    setQuery("");
  };

  const handleCopyLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "dashboard": return <LayoutDashboard className="h-4 w-4 text-zinc-400" />;
      case "billing": return <CreditCard className="h-4 w-4 text-zinc-400" />;
      case "settings": return <Settings className="h-4 w-4 text-zinc-400" />;
      case "chat": return <MessageSquare className="h-4 w-4 text-zinc-400" />;
      case "team": return <User className="h-4 w-4 text-zinc-400" />;
      case "blog": return <FileText className="h-4 w-4 text-zinc-400" />;
      default: return <History className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 animate-fade-in">
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity" onClick={closeCommandPalette} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-10 text-white flex flex-col max-h-[500px]">
        <Command label="Global Command Menu" className="w-full flex flex-col" shouldFilter={false}>
          <div className="flex items-center border-b border-zinc-800 px-4 py-3.5">
            <Search className="mr-3 h-4 w-4 shrink-0 text-zinc-400" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search sections, files, team members, or actions..."
              className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-zinc-500 text-white border-0 focus:ring-0 focus:outline-none"
              autoFocus
            />
            {isLoading && <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin ml-2 shrink-0" />}
          </div>

          <Command.List className="overflow-y-auto p-2 space-y-1 select-none flex-1 max-h-[400px]">
            {query.length > 1 && !isLoading && (!searchResults || (searchResults.posts.length === 0 && searchResults.members.length === 0 && searchResults.files.length === 0)) && (
              <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                No results found for "{query}".
              </Command.Empty>
            )}

            {!query && recentSearches.length > 0 && (
              <Command.Group heading="Recent Searches" className="text-xxs font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 mt-1">
                {recentSearches.map((recent) => (
                  <Command.Item
                    key={recent.path}
                    onSelect={() => runCommand(() => router.push(recent.path))}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    {renderIcon(recent.icon)}
                    <span>{recent.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {!query && (
              <Command.Group heading="Navigation" className="text-xxs font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 mt-1">
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard"), "/dashboard", "Dashboard", "dashboard")}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                    <span>Go to Dashboard</span>
                  </div>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/ai"), "/ai", "AI Chat", "chat")}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-zinc-400" />
                    <span>AI Chat</span>
                  </div>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/team"), "/team", "Team", "team")}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span>Team</span>
                  </div>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/billing"), "/billing", "Billing", "billing")}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <span>Billing</span>
                  </div>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/settings"), "/settings", "Settings", "settings")}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-zinc-400" />
                    <span>Settings</span>
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            {query && searchResults && searchResults.posts?.length > 0 && (
              <Command.Group heading="Blog Posts" className="text-xxs font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 mt-1">
                {searchResults.posts.map((post) => (
                  <Command.Item
                    key={post.id}
                    onSelect={() => runCommand(() => router.push(`/admin/blog/${post.id}/edit`), `/admin/blog/${post.id}/edit`, `Edit ${post.title}`, "blog")}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <span className="truncate">{post.title}</span>
                      {post.published ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">Published</span>
                      ) : (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">Draft</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query && searchResults && searchResults.members?.length > 0 && (
              <Command.Group heading="Team Members" className="text-xxs font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 mt-1">
                {searchResults.members.map((member) => (
                  <Command.Item
                    key={member.id}
                    onSelect={() => runCommand(() => router.push(`/team`), "/team", `Team`, "team")}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name || member.email} className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                          {(member.name || member.email).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{member.name || member.email}</span>
                      <span className="text-xs text-zinc-500">{member.role}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query && searchResults && searchResults.files?.length > 0 && (
              <Command.Group heading="Files" className="text-xxs font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 mt-1">
                {searchResults.files.map((file) => (
                  <Command.Item
                    key={file.id}
                    onSelect={() => runCommand(() => window.open(file.url, "_blank"))}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-zinc-500 shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => handleCopyLink(e, file.url)} className="p-1 hover:text-indigo-400 transition-colors">
                        <LinkIcon className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); window.open(file.url, "_blank"); }} className="p-1 hover:text-indigo-400 transition-colors">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className="text-xxs font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 mt-3">
              <Command.Item onSelect={() => runCommand(() => router.push("/ai/generate"))} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>New AI Chat</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/team"))} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors">
                <User className="h-4 w-4 text-pink-400" />
                <span>Invite Member</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/files"))} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors">
                <UploadCloud className="h-4 w-4 text-purple-400" />
                <span>Upload File</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/admin/blog"))} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors">
                <FileEdit className="h-4 w-4 text-emerald-400" />
                <span>New Blog Post</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/settings/organization"))} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors">
                <Building className="h-4 w-4 text-blue-400" />
                <span>Create Organization</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark"))} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors">
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Toggle Theme</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => { toast("Feedback modal opened") })} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors">
                <Bug className="h-4 w-4 text-rose-400" />
                <span>Report bug</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
        
        <div className="bg-zinc-950/40 border-t border-zinc-800/60 px-4 py-2 text-xxs text-zinc-500 flex justify-between items-center">
          <span>Use arrow keys to navigate, enter to select.</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
