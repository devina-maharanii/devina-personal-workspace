"use client";

import { useState } from "react";
import { updateNotificationPrefs } from "@/lib/actions/settings";
import { toast } from "sonner";
import { 
  Bell, 
  Mail, 
  Settings, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert,
  FileText,
  Users,
  Compass,
  AlertCircle,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage } from "@/lib/utils";

interface NotificationPrefsProps {
  initialPrefs: {
    inAppNotifications: boolean;
    emailNotificationTypes: string[];
    notificationDigestFreq: string;
  };
}

const EMAIL_CATEGORIES = [
  { 
    id: "security", 
    label: "Security & Authentication alerts", 
    description: "Get notified immediately when passwords are changed, new sessions are authorized, or 2FA updates occur.",
    icon: ShieldAlert
  },
  { 
    id: "files", 
    label: "File Storage & Uploads", 
    description: "Receive confirmations of large file uploads, processing completions, and storage capacity limits warnings.",
    icon: FileText
  },
  { 
    id: "teams", 
    label: "Workspace & Team Updates", 
    description: "Receive alerts for incoming organization invitations, membership changes, and ownership transfers.",
    icon: Users
  },
  { 
    id: "features", 
    label: "New Product Features", 
    description: "Stay in the loop with weekly newsletters describing new AI models, platform tools, and feature additions.",
    icon: Compass
  },
  { 
    id: "system", 
    label: "System Status & Maintenance", 
    description: "Receive critical updates about planned maintenance schedules or downtime alerts.",
    icon: AlertCircle
  },
];

export function NotificationPrefsClient({ initialPrefs }: NotificationPrefsProps) {
  const [inApp, setInApp] = useState(initialPrefs.inAppNotifications);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialPrefs.emailNotificationTypes);
  const [digest, setDigest] = useState(initialPrefs.notificationDigestFreq);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const triggerAutoSave = async (updatedInApp: boolean, updatedTypes: string[], updatedDigest: string) => {
    setSaveStatus("saving");
    try {
      const result = await updateNotificationPrefs({
        inApp: updatedInApp,
        emailTypes: updatedTypes,
        digest: updatedDigest,
      });
      if (result.success) {
        setSaveStatus("saved");
        setTimeout(() => {
          setSaveStatus((current) => current === "saved" ? "idle" : current);
        }, 2500);
      } else {
        setSaveStatus("error");
        toast.error("Failed to auto-save notification settings.");
      }
     
    } catch (err: unknown) {
      setSaveStatus("error");
      toast.error(getErrorMessage(err, "Failed to auto-save notification settings."));
    }
  };

  const handleToggleInApp = () => {
    const newVal = !inApp;
    setInApp(newVal);
    triggerAutoSave(newVal, selectedTypes, digest);
  };

  const handleToggleEmailType = (typeId: string) => {
    setSelectedTypes((prev) => {
      const newVal = prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId];
      triggerAutoSave(inApp, newVal, digest);
      return newVal;
    });
  };

  const handleSetDigest = (freqId: string) => {
    setDigest(freqId);
    triggerAutoSave(inApp, selectedTypes, freqId);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutoSave(inApp, selectedTypes, digest);
  };

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-400" /> Notifications & Communications Preferences
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-semibold">
            Customize when and where you want to receive alerts, newsletters, security updates, and digests.
          </p>
        </div>

        {/* Real-time Save Status Indicator */}
        <AnimatePresence mode="wait">
          {saveStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 select-none ${
                saveStatus === "saving"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                  : saveStatus === "saved"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saveStatus === "saved" && <Check className="h-3.5 w-3.5" />}
              {saveStatus === "error" && <AlertCircle className="h-3.5 w-3.5" />}
              <span>
                {saveStatus === "saving" && "Saving Changes..."}
                {saveStatus === "saved" && "Changes Saved"}
                {saveStatus === "error" && "Error Saving"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* In-App Alerts Master Switch */}
        <div className="p-6 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-indigo-400" /> In-App Platform Notifications
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-2xl">
                Enable displaying transient in-app toast alerts, notifications lists, and badges inside your header workspace dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleInApp}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                inApp ? "bg-indigo-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  inApp ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Email Alert Channels Category */}
        <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <Mail className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-200">Email Subscriptions</h3>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
            Select the specific event classifications for which you wish to receive automated email notifications.
          </p>

          <div className="space-y-3 pt-2">
            {EMAIL_CATEGORIES.map((cat) => {
              const isChecked = selectedTypes.includes(cat.id);
              const CatIcon = cat.icon;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleToggleEmailType(cat.id)}
                  className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:bg-zinc-900/10 ${
                    isChecked 
                      ? "border-indigo-500/20 bg-indigo-950/5 text-white" 
                      : "border-zinc-850 bg-zinc-950/30 text-zinc-400"
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`p-2 bg-zinc-900 border rounded-xl mt-0.5 shrink-0 ${
                      isChecked ? "border-indigo-500/20 text-indigo-400" : "border-zinc-850 text-zinc-550"
                    }`}>
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-zinc-200">{cat.label}</span>
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold max-w-xl">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
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
        <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-200">Digest Delivery Frequency</h3>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
            Select the consolidation interval for delivery of your checked email alerts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              { id: "immediate", label: "Immediate updates", desc: "Receive email alerts instantly as individual event records fire." },
              { id: "daily", label: "Daily summary", desc: "A singular consolidated daily email report of account activity." },
              { id: "weekly", label: "Weekly digest", desc: "A singular consolidated weekly newsletter summary report." },
            ].map((freq) => {
              const isSelected = digest === freq.id;

              return (
                <div
                  key={freq.id}
                  onClick={() => handleSetDigest(freq.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:bg-zinc-900/10 ${
                    isSelected 
                      ? "border-indigo-500/20 bg-indigo-950/5" 
                      : "border-zinc-850 bg-zinc-950/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                      {freq.label}
                    </span>
                    <span className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-indigo-500 text-indigo-500" : "border-zinc-700"
                    }`}>
                      {isSelected && <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                    {freq.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveStatus === "saving"}
            className={`flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer ${
              saveStatus === "saved"
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-100" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Preferences Saved" : "Save Preferences"}
            </span>
          </button>
        </div>

      </form>
    </div>
  );
}
