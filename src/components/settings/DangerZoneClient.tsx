"use client";

import { useState, useTransition } from "react";
import { exportUserData, deleteUserAccount } from "@/lib/actions/settings";
import { useClerk } from "@/lib/clerk-client";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Download, 
  Trash2, 
  Loader2, 
  ShieldAlert
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export function DangerZoneClient() {
  const { signOut } = useClerk();
  
  // Data export state
  const [isExporting, setIsExporting] = useState(false);

  // Account deletion state
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, startDeletionTransition] = useTransition();

  // Handle GDPR compliance data export download
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      toast.info("Compiling your system footprint. This may take a moment...", {
        duration: 4000
      });

      const exportPayload = await exportUserData();

      // Convert payload structure into a downloadable JSON file
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportPayload, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `gdpr-data-export-${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("GDPR-compliant data export ready & downloaded successfully!");
     
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to compile data export."));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmText !== "delete my account") {
      toast.error("Please type the required phrase exactly to authorize deletion.");
      return;
    }

    startDeletionTransition(async () => {
      try {
        toast.loading("Purging Stripe subscriptions, DB tables, and Clerk profiles...", {
          id: "delete-loading"
        });

        const result = await deleteUserAccount(confirmText);

        if (result.success) {
          toast.dismiss("delete-loading");
          toast.success("Your account and associated data have been permanently erased.");
          
          // Sign out of Clerk and redirect
          await signOut();
          window.location.href = "/";
        }
       
      } catch (err: unknown) {
        toast.dismiss("delete-loading");
        toast.error(getErrorMessage(err, "Failed to purge account. Please contact system administrators."));
      }
    });
  };

  const isConfirmed = confirmText === "delete my account";

  return (
    <div className="space-y-10">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" /> Danger Zone Settings
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-semibold">
          Perform critical identity procedures, request regulatory GDPR audits, or permanently purge your platform data.
        </p>
      </div>

      {/* GDPR Data Portability */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
        <div className="flex gap-4">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl w-fit shrink-0">
            <Download className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-200">GDPR Right of Access (Data Portability)</h3>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-2xl">
              Under GDPR Article 15, you have the right to request a complete machine-readable copy of your personal data footprint. We compile all associated records, active workspace files, chat histories, API keys, and system log audits into a single JSON file.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-850 hover:text-white transition-all text-xs font-bold text-zinc-300 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            ) : (
              <Download className="h-4 w-4 text-indigo-400" />
            )}
            <span>Request Personal Data Export</span>
          </button>
        </div>
      </div>

      {/* Critical Purge Account */}
      <div className="p-6 sm:p-8 rounded-3xl border border-red-500/25 bg-red-950/[0.03] space-y-6">
        <div className="flex gap-4">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl w-fit shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-200">Permanently Delete Profile Account</h3>
            <p className="text-[11px] text-red-400/70 font-semibold leading-relaxed max-w-2xl">
              Proceeding with this operation is **irreversible**. By deleting your account:
            </p>
            <ul className="text-[10px] text-red-400/60 font-semibold leading-relaxed space-y-1 pl-4 list-disc max-w-xl pt-2">
              <li>All active Stripe subscription plans are instantly terminated.</li>
              <li>Your database footprint (including uploaded storage files, workspace teams membership seats, active conversation logs, and generated developer keys) is permanently erased.</li>
              <li>Your Clerk profile authentication identity is deleted.</li>
            </ul>
          </div>
        </div>

        {/* Deletion confirmation inputs */}
        <form onSubmit={handleDeleteAccountSubmit} className="space-y-4 pt-4 border-t border-red-500/10 max-w-xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider block">
              To verify deletion, please type: <span className="font-mono text-xs font-bold text-red-300 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded select-none">delete my account</span>
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-red-500/20 focus:border-red-500 rounded-xl text-xs text-red-300 focus:outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={!isConfirmed || isDeleting}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-red-650 hover:bg-red-600 disabled:bg-zinc-900 disabled:border-zinc-800 disabled:text-zinc-550 border border-red-500/20 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer w-full sm:w-auto justify-center"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Delete Account & Purge Data</span>
          </button>
        </form>
      </div>

    </div>
  );
}
