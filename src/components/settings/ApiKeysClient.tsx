 
"use client";

import { useState, useEffect, useTransition } from "react";
import { generateUserApiKey, getUserApiKeys, revokeUserApiKey } from "@/lib/actions/settings";
import { toast } from "sonner";
import { 
  Key, 
  Trash2, 
  Loader2, 
  Copy, 
  Check, 
  AlertTriangle,
  Code,
  Terminal,
  Plus
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
}

interface RawApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string | Date;
  expiresAt: string | Date | null;
  lastUsedAt: string | Date | null;
}

export function ApiKeysClient() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [keyName, setKeyName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Generated Key overlay/banner
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRevokingId, setIsRevokingId] = useState<string | null>(null);

  // Active tab for integration code snippets
  const [codeTab, setCodeTab] = useState<"curl" | "node">("curl");

  // Load user API keys
  const fetchKeys = async () => {
    try {
      setIsLoadingKeys(true);
      const result = await getUserApiKeys();
      if (result.success && result.keys) {
        const rawKeys = Array.isArray(result.keys) ? (result.keys as RawApiKey[]) : [];
        const parsedKeys = rawKeys.map((key) => ({
          ...key,
          createdAt: new Date(key.createdAt),
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
          lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
        }));
        setKeys(parsedKeys);
      }
     
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load developer keys."));
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast.error("Please enter a name for your API key.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await generateUserApiKey({
          name: keyName,
          expiresAt: expiryDate || undefined,
        });

        if (result.success && result.rawKey) {
          setNewlyGeneratedKey(result.rawKey);
          setKeyName("");
          setExpiryDate("");
          toast.success("External API key generated successfully!");
          
          // Re-fetch list
          await fetchKeys();
        }
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to generate developer credentials."));
      }
    });
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      setIsRevokingId(keyId);
      const result = await revokeUserApiKey(keyId);
      if (result.success) {
        toast.success("Developer credential revoked successfully.");
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      }
     
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not delete developer key."));
    } finally {
      setIsRevokingId(null);
    }
  };

  const handleCopyKey = () => {
    if (!newlyGeneratedKey) return;
    navigator.clipboard.writeText(newlyGeneratedKey);
    setCopiedKey(true);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getCurlSnippet = (key: string) => `curl -X POST https://api.domain.com/v1/chat \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello from developer integrations!"
  }'`;

  const getNodeSnippet = (key: string) => `const response = await fetch("https://api.domain.com/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "Hello from developer integrations!"
  })
});

const data = await response.json();
console.log(data);`;

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Key className="h-5 w-5 text-indigo-400" /> Developer Access API Keys
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-semibold">
          Create and manage custom cryptographic credentials to authenticate your background workflows and external client applications.
        </p>
      </div>

      {/* Newly Generated Key Alert Section */}
      {newlyGeneratedKey && (
        <div className="p-6 rounded-3xl border border-indigo-500/20 bg-indigo-950/10 backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-fit shrink-0">
              <AlertTriangle className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-indigo-200">Save your API key securely!</h3>
              <p className="text-[11px] text-indigo-400/80 font-semibold leading-relaxed max-w-2xl">
                Please copy this key and save it somewhere secure (like a password vault). For security purposes, **you will not be able to view this key again** once you refresh the browser page or navigate away.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 max-w-xl">
            <div className="flex-1 px-4 py-3 bg-zinc-950/80 border border-zinc-850 rounded-2xl text-xs font-mono text-indigo-300 select-all overflow-x-auto whitespace-nowrap scrollbar-none">
              {newlyGeneratedKey}
            </div>
            <button
              onClick={handleCopyKey}
              className="p-3 rounded-2xl border border-indigo-500/20 bg-indigo-600 hover:bg-indigo-500 text-white transition-all shrink-0 active:scale-90 cursor-pointer"
            >
              {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Generate API Key Form */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-400" /> Generate New Developer Key
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
            Bind an authenticated key credential for external webhook integrations.
          </p>
        </div>

        <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row items-end gap-4">
          {/* Key Name */}
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              Key Description Name
            </label>
            <input
              type="text"
              required
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. Github Actions / Analytics worker"
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium"
            />
          </div>

          {/* Expiration date (Optional) */}
          <div className="w-full sm:w-60 space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              Expiry Date (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 cursor-pointer font-medium"
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer h-[42px] shrink-0"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Create Key</span>
          </button>
        </form>
      </div>

      {/* Existing Credentials Table */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" /> Active API Keys
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
            Active access keys currently authorized to invoke background endpoints on behalf of your workspaces.
          </p>
        </div>

        {isLoadingKeys ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 border border-dashed border-zinc-850 rounded-2xl">
            <Key className="h-8 w-8 text-zinc-650" />
            <span className="text-xs font-semibold text-zinc-400">No developer credentials created.</span>
            <p className="text-[10px] text-zinc-550 max-w-xs font-medium">
              Create an API key above to start integrating external API services.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:-mx-8">
            <div className="inline-block min-w-full align-middle px-6 sm:px-8">
              <table className="min-w-full divide-y divide-zinc-900 text-left">
                <thead>
                  <tr className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">
                    <th scope="col" className="pb-3.5 pl-2">Name</th>
                    <th scope="col" className="pb-3.5">Key Prefix</th>
                    <th scope="col" className="pb-3.5">Created Date</th>
                    <th scope="col" className="pb-3.5">Expiry</th>
                    <th scope="col" className="pb-3.5">Last Used</th>
                    <th scope="col" className="pb-3.5 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {keys.map((k) => (
                    <tr key={k.id} className="text-xs font-medium hover:bg-zinc-900/5 transition-all">
                      <td className="py-4 pl-2 font-bold text-zinc-200">{k.name}</td>
                      <td className="py-4"><code className="font-mono text-indigo-400 bg-zinc-950/40 border border-zinc-900 px-2 py-0.5 rounded text-[11px]">{k.keyPrefix}</code></td>
                      <td className="py-4 text-zinc-450 text-[11px]">
                        {k.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 text-[11px]">
                        {k.expiresAt ? (
                          new Date() > k.expiresAt ? (
                            <span className="text-red-400 font-bold">Expired</span>
                          ) : (
                            <span className="text-zinc-400">
                              {k.expiresAt.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-550">Never</span>
                        )}
                      </td>
                      <td className="py-4 text-zinc-450 text-[11px]">
                        {k.lastUsedAt ? (
                          k.lastUsedAt.toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        ) : (
                          <span className="text-zinc-650">Never</span>
                        )}
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          disabled={isRevokingId === k.id}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 transition-all inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                          title="Revoke Key"
                        >
                          {isRevokingId === k.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Code Snippets & Usage Examples */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Code className="h-4 w-4 text-indigo-400" /> API Integration Guide
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
              Learn how to implement your developer tokens into production requests.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-850 rounded-xl w-fit">
            <button
              onClick={() => setCodeTab("curl")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                codeTab === "curl" ? "bg-zinc-850 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              cURL Request
            </button>
            <button
              onClick={() => setCodeTab("node")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                codeTab === "node" ? "bg-zinc-850 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Node.js Fetch
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-5 bg-zinc-950/80 border border-zinc-850 rounded-2xl text-[11px] font-mono text-zinc-350 leading-relaxed overflow-x-auto select-all max-h-[250px] scrollbar-thin">
            <code>
              {codeTab === "curl" 
                ? getCurlSnippet(newlyGeneratedKey || "ak_live_7x91b2c...") 
                : getNodeSnippet(newlyGeneratedKey || "ak_live_7x91b2c...")}
            </code>
          </pre>
        </div>
      </div>

    </div>
  );
}
