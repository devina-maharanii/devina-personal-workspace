"use client";

import { useState, useTransition } from "react";
import { 
  createAnnouncement, 
  toggleAnnouncementActive, 
  deleteAnnouncement 
} from "@/lib/actions/admin";
import { 
  Megaphone, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Clock, 
  CheckCircle
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: string;
  active: boolean;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
}

interface AnnouncementsPageClientProps {
   
  initialAnnouncements: AnnouncementItem[];
}

export function AnnouncementsPageClient({ initialAnnouncements }: AnnouncementsPageClientProps) {
   
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // Create Announcement submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSuccessMsg("");
    startTransition(async () => {
      try {
        const start = startsAt ? new Date(startsAt) : null;
        const end = endsAt ? new Date(endsAt) : null;
        
        const created = await createAnnouncement({
          title,
          message,
          type,
          startsAt: start,
          endsAt: end,
        });

        setAnnouncements((prev) => [created, ...prev]);
        
        // Reset form
        setTitle("");
        setMessage("");
        setType("INFO");
        setStartsAt("");
        setEndsAt("");

        setSuccessMsg("Global announcement broadcasted successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to create announcement."));
      }
    });
  };

  // Toggle Active Action
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    startTransition(async () => {
      try {
        await toggleAnnouncementActive(id, !currentActive);
        setAnnouncements((prev) =>
          prev.map((ann) => (ann.id === id ? { ...ann, active: !currentActive } : ann))
        );
        setSuccessMsg(`Announcement status toggled successfully.`);
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to toggle announcement state."));
      }
    });
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this announcement?")) return;
    startTransition(async () => {
      try {
        await deleteAnnouncement(id);
        setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
        setSuccessMsg("Announcement deleted successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
       
      } catch (error: unknown) {
        alert(getErrorMessage(error, "Failed to delete announcement."));
      }
    });
  };

  // Helper to resolve icon styles
  const getTypeBadge = (t: string) => {
    switch (t) {
      case "WARNING":
        return "bg-amber-950/40 border border-amber-800/30 text-amber-400";
      case "MAINTENANCE":
        return "bg-rose-950/40 border border-rose-800/30 text-rose-400";
      default:
        return "bg-indigo-950/40 border border-indigo-800/30 text-indigo-400";
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            System Announcements
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Broadcast emergency alerts, feature drops, scheduled maintenance banners, and timeline notices.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <CheckCircle className="h-4.5 w-4.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form Block */}
        <div className="lg:col-span-1 p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md h-fit space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-400" /> Create Site Announcement
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">Title / Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled System Upgrade"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">Alert Message</label>
              <textarea
                required
                rows={3}
                placeholder="Details of the announcement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">Announcement Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 cursor-pointer"
              >
                <option value="INFO">Information (Indigo Banner)</option>
                <option value="WARNING">Alert Warning (Amber Banner)</option>
                <option value="MAINTENANCE">Maintenance (Rose Banner)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">Starts At (Optional)</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xxs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">Ends At (Optional)</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xxs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition-all mt-4"
            >
              <Plus className="h-4 w-4" />
              <span>Broadcast Notice</span>
            </button>
          </form>
        </div>

        {/* Existing Announcements List */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" /> Broadcast History Logs
          </h3>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xxs font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Headline</th>
                  <th className="pb-3 px-3">Alert Level</th>
                  <th className="pb-3 px-3">Active Status</th>
                  <th className="pb-3 px-3">Schedule Timeline</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-550 text-xs">
                      No active announcements schedules logged.
                    </td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann.id} className="border-b border-zinc-800/40 text-zinc-350 hover:bg-zinc-800/10 transition-all">
                      <td className="py-4 px-3 max-w-xs">
                        <div className="font-semibold text-zinc-100 text-xs truncate" title={ann.title}>
                          {ann.title}
                        </div>
                        <div className="text-zinc-500 text-xxs mt-0.5 line-clamp-1" title={ann.message}>
                          {ann.message}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold uppercase tracking-wider ${getTypeBadge(ann.type)}`}>
                          {ann.type}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <button
                          onClick={() => handleToggleActive(ann.id, ann.active)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {ann.active ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                              <ToggleRight className="h-5 w-5 text-emerald-500" />
                              <span>Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                              <ToggleLeft className="h-5 w-5 text-zinc-700" />
                              <span>Paused</span>
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-3 text-xxs text-zinc-450 font-medium space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-650">Start:</span>
                          <span>{ann.startsAt ? new Date(ann.startsAt).toLocaleString() : "Immediate"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-650">End:</span>
                          <span>{ann.endsAt ? new Date(ann.endsAt).toLocaleString() : "Indefinite"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-900/30 transition-all"
                          title="Delete announcement notice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
