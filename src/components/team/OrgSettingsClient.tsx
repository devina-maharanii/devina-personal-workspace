/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import { MembershipRole } from "@prisma/client";
import { updateOrganizationAction, deleteOrganizationAction } from "@/lib/actions/team";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgStore } from "@/stores/orgStore";
import { getErrorMessage } from "@/lib/utils";

interface OrgSettingsClientProps {
  userRole: MembershipRole | null;
  activeOrg: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

export default function OrgSettingsClient({ userRole, activeOrg }: OrgSettingsClientProps) {
  const [name, setName] = useState(activeOrg.name);
  const [slug, setSlug] = useState(activeOrg.slug);
  const [logo, setLogo] = useState<string | null>(activeOrg.logo);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");

  const [isPending, startTransition] = useTransition();
  const { setActiveOrgId } = useOrgStore();

  const isOwner = userRole === "OWNER";
  const isAdmin = userRole === "ADMIN";
  const canEdit = isOwner || isAdmin;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    startTransition(async () => {
      try {
        await updateOrganizationAction(activeOrg.id, name, logo, slug);
        toast.success("Workspace details updated successfully!");
        window.location.reload();
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to update workspace details."));
      }
    });
  };

  const handleDelete = () => {
    if (confirmSlug !== activeOrg.slug) {
      toast.error("Confirmation slug does not match.");
      return;
    }

    startTransition(async () => {
      try {
        await deleteOrganizationAction(activeOrg.id);
        toast.success("Workspace deleted successfully.");
        // Clear active org cookie to force re-evaluation
        setActiveOrgId("");
        window.location.href = "/dashboard";
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to delete workspace."));
      }
    });
  };

  return (
    <div className="space-y-8 select-none max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Customize workspace name, vanity slug, and branding assets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl p-6">
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Org Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-3">
                  Workspace Logo
                </label>
                <div className="flex items-center gap-4">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo Preview"
                      className="h-16 w-16 rounded-xl border border-zinc-800 object-cover bg-zinc-950"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {canEdit ? (
                    <div className="space-y-1">
                      <UploadButton
                        endpoint="orgLogo"
                        onClientUploadComplete={(res) => {
                          const url = res?.[0]?.url;
                          if (url) {
                            setLogo(url);
                            toast.success("Logo uploaded successfully!");
                          }
                        }}
                        onUploadError={(err: Error) => {
                          toast.error(`Upload error: ${err.message}`);
                        }}
                        appearance={{
                          button:
                            "bg-zinc-850 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer border border-zinc-800",
                          allowedContent: "text-xxs text-zinc-500 mt-1",
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">Read-only permissions</span>
                  )}
                </div>
              </div>

              {/* Org Name */}
              <div>
                <label htmlFor="org-name" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  id="org-name"
                  required
                  disabled={!canEdit || isPending}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              {/* Org Slug */}
              <div>
                <label htmlFor="org-slug" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Workspace Slug
                </label>
                <div className="flex rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden focus-within:border-indigo-500">
                  <span className="px-3.5 py-2.5 text-sm text-zinc-600 select-none bg-zinc-900/50 border-r border-zinc-800">
                    /org/
                  </span>
                  <input
                    type="text"
                    id="org-slug"
                    required
                    disabled={!canEdit || isPending}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-corp"
                    className="w-full bg-transparent border-0 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  Only lowercase letters, numbers, and hyphens are allowed.
                </p>
              </div>

              {canEdit && (
                <div className="pt-2 border-t border-zinc-800/40 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar Info & Danger Zone */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Workspace Details</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Your Role</span>
                <span className="text-white font-bold">{userRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Workspace ID</span>
                <span className="text-zinc-400 font-mono select-all truncate max-w-[140px]" title={activeOrg.id}>
                  {activeOrg.id}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-red-950/40 bg-red-950/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xxs text-zinc-400 mb-4 leading-relaxed">
              Deleting this organization deletes all documents, custom prompt templates, team chat logs, and invites forever.
            </p>

            {isOwner ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full py-2 bg-red-650/10 hover:bg-red-650 text-red-400 hover:text-white border border-red-800/40 hover:border-transparent text-xs font-semibold rounded-xl transition-all cursor-pointer text-center block"
              >
                Delete Workspace
              </button>
            ) : (
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-500">
                Only the organization Owner can delete this workspace.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl z-10"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-1.5">
                <AlertTriangle className="text-red-500 h-5 w-5 animate-bounce" />
                <span>Are you absolutely sure?</span>
              </h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                This will delete the workspace <strong>{activeOrg.name}</strong> and all associated logs, templates, files, and memberships. This action cannot be undone.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="confirm-slug" className="block text-xs font-semibold text-zinc-500 mb-1.5">
                    Type the workspace slug <strong className="text-white select-all">{activeOrg.slug}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    id="confirm-slug"
                    required
                    value={confirmSlug}
                    onChange={(e) => setConfirmSlug(e.target.value)}
                    placeholder="Enter slug here"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPending || confirmSlug !== activeOrg.slug}
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-red-650 hover:bg-red-500 disabled:opacity-40 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Delete Workspace</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
