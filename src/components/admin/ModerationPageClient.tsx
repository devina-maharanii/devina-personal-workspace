/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useTransition } from "react";
import { 
  dismissReports, 
  removeReportedContent, 
  warnAuthor 
} from "@/lib/actions/admin";
import { 
  Shield, 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  User, 
  Clock, 
  Mail, 
  Send,
  MessageSquare,
  Globe,
  Loader2,
  FileText,
  X
} from "lucide-react";
import Link from "next/link";
import { getErrorMessage } from "@/lib/utils";

interface ModerationReport {
  id: string;
  postId: string;
  reason: string;
  createdAt: string | Date;
  reporter?: {
    name: string | null;
    email: string | null;
  } | null;
  post?: {
    title: string | null;
    slug: string | null;
    organization?: {
      name: string | null;
    } | null;
    author?: {
      name: string | null;
      email: string | null;
    } | null;
  } | null;
}

interface ModerationPageClientProps {
   
  initialReports: ModerationReport[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function ModerationPageClient({ initialReports, initialPagination }: ModerationPageClientProps) {
   
  const [reports, setReports] = useState<ModerationReport[]>(initialReports);
  const [_pagination, _setPagination] = useState(initialPagination);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");
  
  // Warn Modal/Input states
  const [warningPostId, setWarningPostId] = useState<string | null>(null);
  const [warningText, setWarningText] = useState("");
  const [warningLoading, setWarningLoading] = useState(false);

  // Pagination page transition helper
  const _handlePageChange = async (_newPage: number) => {
    // If you need server side pagination, you can load via server actions,
    // or keep client-side filters for instant updates if the data size is manageable.
    // For now we'll handle the reports inline and provide feedback.
  };

  // Approve / Dismiss Reports (dismiss report, decrement/reset reportCount)
  const handleDismiss = async (postId: string) => {
    if (!confirm("Are you sure you want to dismiss all reports for this article? This will declare the content safe and clear it from the queue.")) return;
    
    startTransition(async () => {
      try {
        await dismissReports(postId);
        setReports((prev) => prev.filter((r) => r.postId !== postId));
        setSuccessMsg("Report flags successfully dismissed.");
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to dismiss reports."));
      }
    });
  };

  // Delete Reported Content (permanently prunes article)
  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to permanently delete this blog post? This will remove it from the database and is irreversible.")) return;

    startTransition(async () => {
      try {
        await removeReportedContent(postId);
        setReports((prev) => prev.filter((r) => r.postId !== postId));
        setSuccessMsg("Flagged publication removed permanently.");
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to delete post."));
      }
    });
  };

  // Warning submit
  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningPostId || !warningText.trim()) return;

    setWarningLoading(true);
    try {
      await warnAuthor(warningPostId, warningText);
      setSuccessMsg("Warning notification & email sent to author.");
      setWarningPostId(null);
      setWarningText("");
      setTimeout(() => setSuccessMsg(""), 4000);
     
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to send warning."));
    } finally {
      setWarningLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500 animate-pulse" />
            Moderation Control Queue
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Review reported publications, check user flags, and enforce system-wide quality and safety policies.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-4 py-2 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5 h-fit">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md space-y-2">
          <p className="text-xxs font-bold uppercase tracking-widest text-zinc-500">Reported Tickets</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-red-400">{reports.length}</p>
            <p className="text-xs font-medium text-zinc-500">active issues</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md space-y-2">
          <p className="text-xxs font-bold uppercase tracking-widest text-zinc-500">Status Check</p>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-950/20 px-3 py-1 rounded-full border border-amber-500/20 w-fit">
            <AlertTriangle className="h-4 w-4" />
            <span>Action Required</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md space-y-2">
          <p className="text-xxs font-bold uppercase tracking-widest text-zinc-500">System Priority</p>
          <div className="text-xs text-zinc-400 leading-relaxed font-medium">
            Warned authors receive an automated dashboard warning notification accompanied by a warning log email.
          </div>
        </div>
      </div>

      {/* Queue Listing */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-red-400" /> Flagged Publications Queue
        </h3>

        {reports.length === 0 ? (
          <div className="p-12 text-center border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-3">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-200">Moderation Queue is Clear!</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No reported publications found. The community guidelines are being maintained beautifully.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reports.map((report) => {
              const isWarningOpen = warningPostId === report.postId;

              return (
                <div 
                  key={report.id} 
                  className="p-6 rounded-3xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md hover:border-zinc-800 transition-all space-y-6"
                >
                  {/* Top Bar: Reporter info & Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
                        <User className="h-4.5 w-4.5 text-zinc-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-200">Reporter:</span>
                          <span className="text-xs font-semibold text-zinc-300">
                            {report.reporter?.name || "Anonymous Reporter"}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          {report.reporter?.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xxs font-medium text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body: Reason and target post */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      {/* Reason */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                          Report Reason
                        </span>
                        <div className="p-4 rounded-2xl bg-red-950/10 border border-red-500/10 text-xs text-red-200 font-medium italic relative overflow-hidden">
                          <div className="absolute right-3 top-3 opacity-5">
                            <AlertTriangle className="h-16 w-16" />
                          </div>
                          "{report.reason}"
                        </div>
                      </div>

                      {/* Targeted Post */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Targeted Blog Post
                        </span>
                        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between gap-4">
                          <div className="space-y-1 truncate">
                            <h4 className="text-xs font-bold text-zinc-100 truncate">
                              {report.post?.title}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-semibold truncate flex items-center gap-1.5">
                              <Globe className="h-3 w-3 text-zinc-650" />
                              <span>Slug: /{report.post?.slug}</span>
                              <span className="text-zinc-700">|</span>
                              <span>Org: {report.post?.organization?.name || "General"}</span>
                            </p>
                          </div>

                          <Link
                            href={`/blog/${report.post?.slug}`}
                            target="_blank"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-850 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all shrink-0 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Author Details & Quick Actions */}
                    <div className="lg:col-span-1 border border-zinc-850 bg-zinc-950/30 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Author Details
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-zinc-200">
                            {report.post?.author?.name || "Staff Member"}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-semibold">
                            {report.post?.author?.email}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleDismiss(report.postId)}
                          disabled={isPending}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 border border-zinc-750 hover:bg-zinc-750 hover:text-emerald-400 text-xs font-bold text-zinc-200 transition-all cursor-pointer"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Dismiss / Approve</span>
                        </button>

                        <button
                          onClick={() => {
                            if (isWarningOpen) {
                              setWarningPostId(null);
                            } else {
                              setWarningPostId(report.postId);
                              setWarningText("");
                            }
                          }}
                          disabled={isPending}
                          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isWarningOpen 
                              ? "bg-indigo-950/30 border-indigo-500 text-indigo-400"
                              : "bg-zinc-800 border-zinc-750 hover:bg-zinc-750 hover:text-indigo-400 text-zinc-200"
                          }`}
                        >
                          <Mail className="h-4 w-4" />
                          <span>{isWarningOpen ? "Cancel Warning" : "Warn Author"}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(report.postId)}
                          disabled={isPending}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-xs font-bold text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Post</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Warning Input Collapse */}
                  {isWarningOpen && (
                    <form 
                      onSubmit={handleSendWarning} 
                      className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/5 space-y-4 animate-fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Mail className="h-4 w-4" /> Dispatch Warning Notice to Author
                        </h5>
                        <button
                          type="button"
                          onClick={() => setWarningPostId(null)}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Warning Message
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="e.g. Please revise the cover image and references in your recent article as they violate our licensing policies. Failure to comply will lead to deletion."
                          value={warningText}
                          onChange={(e) => setWarningText(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium resize-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={warningLoading || !warningText.trim()}
                          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {warningLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Send Warning</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
