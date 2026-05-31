 
"use client";

import { useState, useEffect, useTransition } from "react";
import { changePassword, getUserSessions, revokeUserSession } from "@/lib/actions/settings";
import { toast } from "sonner";
import { 
  Shield, 
  Lock, 
  Laptop, 
  Smartphone, 
  Globe, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Trash2,
  Check,
  X,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage } from "@/lib/utils";

interface Session {
  id: string;
  isCurrent: boolean;
  status: string;
  ipAddress: string;
  city: string;
  country: string;
  deviceType: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  lastActiveAt: Date;
  createdAt: Date;
}

interface RawSession {
  id: string;
  isCurrent: boolean;
  status: string;
  ipAddress: string;
  city: string;
  country: string;
  deviceType: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  lastActiveAt: string | Date;
  createdAt: string | Date;
}

export function SecuritySettingsClient() {
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // Password validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasMixedCase = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const hasDigitOrSpecial = /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);

  const getStrengthData = () => {
    let score = 0;
    if (newPassword) {
      if (hasMinLength) score++;
      if (hasMixedCase) score++;
      if (hasDigitOrSpecial) score++;
    }
    
    switch (score) {
      case 0:
        return { percent: 0, color: "bg-zinc-850", label: "", text: "text-zinc-500" };
      case 1:
        return { percent: 33, color: "bg-rose-500", label: "Weak", text: "text-rose-400" };
      case 2:
        return { percent: 66, color: "bg-amber-500", label: "Medium", text: "text-amber-400" };
      case 3:
        return { percent: 100, color: "bg-emerald-500", label: "Strong", text: "text-emerald-400" };
      default:
        return { percent: 0, color: "bg-zinc-850", label: "", text: "text-zinc-500" };
    }
  };

  const strength = getStrengthData();
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const _passwordsMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isRevokingId, setIsRevokingId] = useState<string | null>(null);

  // Load user active sessions
  const fetchSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const result = await getUserSessions();
      if (result.success && result.sessions) {
        // Map timestamps back to Date instances
        const rawSessions = Array.isArray(result.sessions) ? (result.sessions as RawSession[]) : [];
        const parsedSessions = rawSessions.map((sess) => ({
          ...sess,
          lastActiveAt: new Date(sess.lastActiveAt),
          createdAt: new Date(sess.createdAt),
        }));
        setSessions(parsedSessions);
      }
     
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load active device sessions."));
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Change Password
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        const result = await changePassword({
          current: currentPassword,
          new: newPassword,
        });

        if (result.success) {
          toast.success("Credentials updated successfully!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Credential rotation failed. Ensure current password is correct."));
      }
    });
  };

  // Revoke active session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      setIsRevokingId(sessionId);
      const result = await revokeUserSession(sessionId);
      if (result.success) {
        toast.success("Device session terminated successfully.");
        // Refresh local list
        setSessions((prev) => prev.filter((sess) => sess.id !== sessionId));
      }
     
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not terminate connection."));
    } finally {
      setIsRevokingId(null);
    }
  };

  // Render device icon helper
  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType.toLowerCase();
    if (type.includes("mobile") || type.includes("phone")) {
      return <Smartphone className="h-5 w-5 text-indigo-400" />;
    }
    return <Laptop className="h-5 w-5 text-indigo-400" />;
  };

  return (
    <div className="space-y-10">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-400" /> Login & Identity Security
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-semibold">
          Secure your account credentials, manage active browser device sessions, and configure two-factor options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Change Password Form (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-400" /> Rotate Security Password
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                Make sure your new password is at least 8 characters long and contains standard safety elements.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium"
                />
              </div>

              {/* New Password & Confirm Password side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>New Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 bg-zinc-950/60 border rounded-xl text-xs text-zinc-200 focus:outline-none font-medium transition-all ${
                      newPassword
                        ? strength.percent === 100
                          ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                          : strength.percent === 66
                          ? "border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                          : "border-rose-500/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        : "border-zinc-850 focus:border-indigo-950"
                    }`}
                  />
                  
                  <AnimatePresence>
                    {newPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-2 pt-1"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-500 font-semibold">Security Strength:</span>
                          <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900/60 rounded-full overflow-hidden border border-zinc-850/50">
                          <motion.div 
                            className={`h-full ${strength.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${strength.percent}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[10px] text-zinc-500 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            {hasMinLength ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                            )}
                            <span className={hasMinLength ? "text-zinc-300 font-semibold" : "font-medium"}>At least 8 characters</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasMixedCase ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                            )}
                            <span className={hasMixedCase ? "text-zinc-300 font-semibold" : "font-medium"}>Mixed case letters (A-Z, a-z)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasDigitOrSpecial ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                            )}
                            <span className={hasDigitOrSpecial ? "text-zinc-300 font-semibold" : "font-medium"}>Contains a number or symbol</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 bg-zinc-950/60 border rounded-xl text-xs text-zinc-200 focus:outline-none font-medium transition-all ${
                      confirmPassword
                        ? passwordsMatch
                          ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                          : "border-rose-500/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        : "border-zinc-850 focus:border-indigo-950"
                    }`}
                  />

                  <AnimatePresence>
                    {confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-1"
                      >
                        {passwordsMatch ? (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                            <Check className="h-3.5 w-3.5" /> Passwords match
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                            <X className="h-3.5 w-3.5" /> Passwords do not match
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPasswordPending}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isPasswordPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Update Password</span>
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Side: Two-Factor Authentication Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md flex flex-col justify-between h-full space-y-6">
            <div className="space-y-4">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl w-fit">
                <ShieldCheck className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Two-Factor Authentication (2FA)</h3>
                <p className="text-[11px] text-zinc-500 mt-1.5 font-medium leading-relaxed">
                  Two-factor authentication adds an extra layer of protection to your profile account. We support standard TOTP mobile authenticator applications (Google Authenticator, Duo, Authy) and secure SMS/backup code verifications.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://accounts.clerk.com" // Link to Clerk's managed accounts page if available or custom route. Clerk handles this centrally.
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:text-white transition-all text-xs font-bold text-zinc-300 w-full justify-center group"
              >
                <span>Configure MFA in Clerk</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Active Sessions Terminal */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-400 animate-pulse" /> Active Device Sessions
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
            This is a list of active browser and application connections currently logged in to your account. You can revoke any other session here.
          </p>
        </div>

        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 border border-dashed border-zinc-850 rounded-2xl">
            <AlertCircle className="h-8 w-8 text-zinc-650" />
            <span className="text-xs font-semibold text-zinc-400">No active sessions located.</span>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {sessions.map((sess) => (
              <div 
                key={sess.id} 
                className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0 transition-all ${
                  sess.isCurrent ? "bg-indigo-950/5 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-2xl" : ""
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl mt-0.5 shrink-0">
                    {getDeviceIcon(sess.deviceType)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">
                        {sess.osName} {sess.osVersion} • {sess.browserName} {sess.browserVersion}
                      </span>
                      {sess.isCurrent ? (
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping" /> Current Session
                        </span>
                      ) : (
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded-full">
                          Active Connection
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-zinc-655" /> {sess.ipAddress}
                      </span>
                      {sess.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-655" /> {sess.city}
                          {sess.country ? `, ${sess.country}` : ""}
                        </span>
                      )}
                      <span>
                        Created: {sess.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Actions */}
                <div>
                  {sess.isCurrent ? (
                    <span className="text-[10px] font-semibold text-zinc-550 border border-zinc-900 bg-zinc-950/40 px-3 py-1.5 rounded-xl block text-center">
                      Current browser
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      disabled={isRevokingId === sess.id}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 hover:border-red-500/30 text-[10px] font-bold text-red-400 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isRevokingId === sess.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>Revoke Session</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
