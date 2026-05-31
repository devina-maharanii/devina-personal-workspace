"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal, Activity, Trash2, PowerOff, Power } from "lucide-react";
import { createWebhookEndpoint, toggleWebhook, deleteWebhook, testWebhook } from "@/lib/actions/webhooks";
import { toast } from "sonner";

export default function WebhookActions({
  action,
  endpointId,
  active,
  buttonStyle = "default"
}: {
  action: "create" | "menu";
  endpointId?: string;
  active?: boolean;
  buttonStyle?: "default" | "primary";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const AVAILABLE_EVENTS = [
    "ai.request.completed",
    "file.uploaded",
    "team.member_invited",
    "team.member_joined",
    "subscription.updated",
    "subscription.canceled",
    "blog.post_published",
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || events.length === 0) return toast.error("URL and at least one event are required.");
    try {
      setIsSubmitting(true);
      await createWebhookEndpoint(url, events);
      toast.success("Webhook created");
      setIsOpen(false);
      setUrl("");
      setEvents([]);
    } catch (_error) {
      toast.error("Failed to create webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEvent = (evt: string) => {
    setEvents(prev => prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt]);
  };

   
  const executeAction = async (promise: Promise<unknown>, successMsg: string) => {
    try {
      await promise;
      toast.success(successMsg);
    } catch (_e) {
      toast.error("Action failed");
    }
  };

  if (action === "create") {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            buttonStyle === "primary"
              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
              : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Add Webhook</h3>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Payload URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-server.com/webhook"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Events to send</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {AVAILABLE_EVENTS.map(evt => (
                      <label key={evt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer border border-transparent hover:border-zinc-700">
                        <input
                          type="checkbox"
                          checked={events.includes(evt)}
                          onChange={() => handleToggleEvent(evt)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/20"
                        />
                        <span className="text-sm text-zinc-300">{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
                  <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {isSubmitting ? "Saving..." : "Add Endpoint"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-zinc-900 border border-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <button
              onClick={() => { executeAction(testWebhook(endpointId!), "Test event sent"); setMenuOpen(false); }}
              className="group flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Activity className="w-4 h-4 mr-2 text-indigo-400" />
              Test endpoint
            </button>
            <button
              onClick={() => { executeAction(toggleWebhook(endpointId!, !active), `Webhook ${active ? 'disabled' : 'enabled'}`); setMenuOpen(false); }}
              className="group flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {active ? <PowerOff className="w-4 h-4 mr-2 text-amber-500" /> : <Power className="w-4 h-4 mr-2 text-emerald-500" />}
              {active ? "Disable" : "Enable"}
            </button>
            <div className="my-1 border-t border-zinc-800" />
            <button
              onClick={() => { executeAction(deleteWebhook(endpointId!), "Webhook deleted"); setMenuOpen(false); }}
              className="group flex w-full items-center px-4 py-2 text-sm text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
