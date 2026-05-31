"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronRight, Menu, Building, Plus, X, Loader2 } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { UserButton } from "@/components/shared/UserButton";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgStore } from "@/stores/orgStore";
import { createOrganizationAction } from "@/lib/actions/team";
import { toast } from "sonner";
import NotificationBell from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { getErrorMessage } from "@/lib/utils";

interface HeaderProps {
  memberships: Array<{
    id: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  activeOrg: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * DashboardHeader provides breadcrumbs, mobile hamburger draws, CMD+K palettes,
 * notification counters, and custom organization switcher dropdowns.
 */
export function DashboardHeader({ memberships, activeOrg }: HeaderProps) {
  const pathname = usePathname();
  const { toggleMobileSidebar, openCommandPalette } = useUIStore();
  const { setActiveOrgId } = useOrgStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isPending, startTransition] = useTransition();

  // Generate breadcrumb links from route pathname
  const segments = pathname.split("/").filter(Boolean);

  const handleSelectOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    setDropdownOpen(false);
    toast.success("Switched workspace context.");
    // Reload to refresh all Server Component data
    window.location.reload();
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    startTransition(async () => {
      try {
        const newOrg = await createOrganizationAction(newOrgName);
        toast.success(`Workspace "${newOrg.name}" created successfully!`);
        // Switch to the newly created organization
        setActiveOrgId(newOrg.id);
        setCreateModalOpen(false);
        setNewOrgName("");
        window.location.reload();
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to create workspace."));
      }
    });
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm relative z-30 select-none">
        {/* Mobile Drawer Trigger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary md:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>

          {/* Breadcrumb path chains */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Home
            </Link>
            {segments.map((seg, index) => {
              const isLast = index === segments.length - 1;
              const url = `/${segments.slice(0, index + 1).join("/")}`;
              return (
                <div key={url} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-muted-foreground/45" />
                  {isLast ? (
                    <span className="capitalize text-foreground truncate max-w-[120px]">
                      {seg.replace("-", " ")}
                    </span>
                  ) : (
                    <Link href={url} className="capitalize hover:text-foreground transition-colors">
                      {seg.replace("-", " ")}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-4">
          {/* Search Command Palette trigger */}
          <button
            onClick={openCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/60 border border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground text-xxs w-40 sm:w-56 text-left transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search (⌘K)</span>
            <kbd className="ml-auto bg-secondary border border-border px-1.5 py-0.5 rounded font-mono text-[9px]">
              ⌘K
            </kbd>
          </button>

          {/* Organization Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/60 border border-border text-foreground/80 hover:text-foreground text-xs transition-colors cursor-pointer"
            >
              <Building className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold max-w-[120px] truncate">{activeOrg.name}</span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border p-1.5 shadow-2xl z-20"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5 mb-1">
                      Workspaces
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {memberships.map((membership) => {
                        const isCurrent = membership.organization.id === activeOrg.id;
                        return (
                          <button
                            key={membership.id}
                            onClick={() => handleSelectOrg(membership.organization.id)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-secondary transition-colors cursor-pointer font-semibold block truncate ${
                              isCurrent ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {membership.organization.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-border mt-1.5 pt-1.5">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setCreateModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-primary/10 text-primary hover:text-primary transition-colors cursor-pointer font-semibold flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Workspace</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Icon Bell */}
          <NotificationBell />

          {/* User profile dropdown triggers */}
          <UserButton />
        </div>
      </header>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl z-10"
            >
              <button
                onClick={() => setCreateModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-foreground mb-2">Create Workspace</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Workspaces allow you to manage members, share files, and centralize AI credit pools.
              </p>

              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <label htmlFor="workspace-name" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    id="workspace-name"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:bg-primary/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Create</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default DashboardHeader;
