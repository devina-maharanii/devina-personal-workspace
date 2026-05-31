"use client";

import { useState, useTransition } from "react";
import { updateEmailPreferencesAction } from "@/lib/actions/notifications";
import { Mail, Settings, ShieldAlert, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

interface SettingsClientProps {
  userRole: string | null;
  activeOrg: {
    id: string;
    name: string;
  };
  initialSettings: {
    emailNotifications: boolean;
    emailNotificationTypes: string[];
    notificationDigestFreq: string;
  };
}

const CATEGORIES = [
  { id: "invite", label: "Team Invites Received", description: "Receive immediate notifications when new invites are issued or pending reminder requests are dispatched." },
  { id: "members", label: "New Teammate Joined", description: "Get notified as soon as invited team members accept their workspace invites and join." },
  { id: "billing", label: "Subscription & Billing", description: "Get payment alerts, invoice reminders, subscription renewals, or payment failure notifications." },
  { id: "credits", label: "AI Credits Quota Warnings", description: "Receive critical reminders when your organization's AI credits usage exceeds 90%." },
  { id: "files", label: "File Upload Completions", description: "Receive confirmation notifications when your media files complete uploading to the workspace storage." },
  { id: "blog", label: "Blog Publish Confirmations", description: "Get alerts when marketing blogs are successfully published or updated." },
];

export default function NotificationSettingsClient({
  userRole,
  activeOrg,
  initialSettings,
}: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const isAdmin = userRole === "OWNER" || userRole === "ADMIN";

  // Form states
  const [_emailEnabled, _setEmailEnabled] = useState(initialSettings.emailNotifications);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialSettings.emailNotificationTypes);
  const [digestFreq, setDigestFreq] = useState<string>(initialSettings.notificationDigestFreq);

  const handleToggleCategory = (catId: string) => {
    if (!isAdmin) return;
    setSelectedTypes((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    startTransition(async () => {
      try {
        await updateEmailPreferencesAction(activeOrg.id, selectedTypes, digestFreq);
        toast.success("Workspace notification preferences updated successfully.");
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to update notification settings."));
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Notification Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure email dispatch rules and digests for the <span className="font-semibold text-indigo-400">{activeOrg.name}</span> workspace.
        </p>
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-900/30 bg-amber-950/10 text-amber-350 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Read-Only Mode</span>
            You are currently logged in as a {userRole || "Viewer"}. Only organization Owners and Admins can modify workspace email preferences.
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Email Master Toggle (UI helper, we keep enabled or toggle matching types) */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-lg text-white">Email Subscriptions</h2>
          </div>

          <p className="text-sm text-zinc-400">
            Control which events trigger automatic emails to your team members. Enabled categories will respect the digest delivery intervals below.
          </p>

          <div className="space-y-4 pt-2">
            {CATEGORIES.map((cat) => {
              const isChecked = selectedTypes.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all ${
                    isAdmin ? "cursor-pointer hover:bg-zinc-900/30" : ""
                  } ${
                    isChecked 
                      ? "border-indigo-900/40 bg-indigo-950/[0.03]" 
                      : "border-zinc-800 bg-zinc-950/30"
                  }`}
                >
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-zinc-200 cursor-pointer">
                      {cat.label}
                    </label>
                    <p className="text-xs text-zinc-550 leading-relaxed max-w-2xl">
                      {cat.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!isAdmin}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                      isChecked ? "bg-indigo-650" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isChecked ? "translate-x-4.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Digest Delivery Frequency */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-lg text-white">Digest Delivery Frequency</h2>
          </div>

          <p className="text-sm text-zinc-400">
            Choose how often you would like notification alerts compiled and delivered.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              { id: "immediate", label: "Immediate alerts", desc: "Emails are sent as soon as events occur." },
              { id: "daily", label: "Daily digest", desc: "A single daily email compiling all workspace events." },
              { id: "weekly", label: "Weekly digest", desc: "A weekly compilation email summarizing activities." },
            ].map((freq) => {
              const isSelected = digestFreq === freq.id;
              return (
                <div
                  key={freq.id}
                  onClick={() => isAdmin && setDigestFreq(freq.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    isAdmin ? "cursor-pointer hover:bg-zinc-900/30" : ""
                  } ${
                    isSelected 
                      ? "border-indigo-900/40 bg-indigo-950/[0.03]" 
                      : "border-zinc-800 bg-zinc-950/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {freq.label}
                    </span>
                    <span className={`h-3 w-3 rounded-full border ${
                      isSelected ? "border-indigo-500 bg-indigo-500" : "border-zinc-700"
                    }`} />
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {freq.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-650 hover:bg-indigo-700 font-semibold text-white transition-all px-6 active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Preferences
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
