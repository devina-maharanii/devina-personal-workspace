/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import { MembershipRole } from "@prisma/client";
import {
  inviteMember,
  removeMember,
  changeMemberRole,
  cancelInvitation,
  resendInvitation,
} from "@/lib/actions/team";
import {
  Building,
  UserPlus,
  Mail,
  Trash2,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage } from "@/lib/utils";

interface TeamViewClientProps {
  currentUserId: string;
  userRole: MembershipRole | null;
  activeOrg: {
    id: string;
    name: string;
    slug: string;
    maxMembers: number;
  };
  members: Array<{
    id: string;
    userId: string;
    role: MembershipRole;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: MembershipRole;
    expiresAt: Date;
  }>;
}

export default function TeamViewClient({
  currentUserId,
  userRole,
  activeOrg,
  members,
  invitations,
}: TeamViewClientProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MembershipRole>("MEMBER");

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    email: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const isOwner = userRole === "OWNER";
  const isAdmin = userRole === "ADMIN";
  const canInvite = isOwner || isAdmin;

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    startTransition(async () => {
      try {
        await inviteMember(inviteEmail, inviteRole, activeOrg.id);
        toast.success(`Invitation sent successfully to ${inviteEmail}!`);
        setInviteEmail("");
        setInviteModalOpen(false);
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to send invitation."));
      }
    });
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;

    startTransition(async () => {
      try {
        await removeMember(memberToRemove.userId, activeOrg.id);
        toast.success(`Removed member ${memberToRemove.email} from workspace.`);
        setRemoveConfirmOpen(false);
        setMemberToRemove(null);
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to remove member."));
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: MembershipRole) => {
    startTransition(async () => {
      try {
        await changeMemberRole(userId, activeOrg.id, newRole);
        toast.success("Member role updated.");
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to change member role."));
      }
    });
  };

  const handleCancelInvite = (inviteId: string, email: string) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${email}?`)) return;

    startTransition(async () => {
      try {
        await cancelInvitation(inviteId);
        toast.success("Invitation cancelled.");
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to cancel invitation."));
      }
    });
  };

  const handleResendInvite = (inviteId: string, email: string) => {
    startTransition(async () => {
      try {
        await resendInvitation(inviteId);
        toast.success(`Invitation resent to ${email}!`);
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to resend invitation."));
      }
    });
  };

  const getRoleBadgeStyle = (role: MembershipRole) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-900/40 text-purple-300 border-purple-800/80";
      case "ADMIN":
        return "bg-blue-900/40 text-blue-300 border-blue-800/80";
      case "MEMBER":
        return "bg-green-900/40 text-green-300 border-green-800/80";
      case "VIEWER":
        return "bg-zinc-800/60 text-zinc-300 border-zinc-700/80";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const totalSeatsUsed = members.length + invitations.length;

  return (
    <div className="space-y-8 select-none">
      {/* Page header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Team Management</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage roles, invite teammates, and govern workspace tenant access.
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Seat usage counter banner */}
      <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400">Workspace Seat Allocations</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {totalSeatsUsed} / {activeOrg.maxMembers} seats active
            </div>
          </div>
        </div>

        <div className="w-48 bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalSeatsUsed >= activeOrg.maxMembers ? "bg-red-500" : "bg-indigo-500"
            }`}
            style={{ width: `${Math.min((totalSeatsUsed / activeOrg.maxMembers) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Members section */}
      <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-850">
          <h2 className="text-sm font-bold text-white">Active Members</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-850/50 bg-zinc-900/10 text-zinc-400 uppercase tracking-wider font-semibold">
                <th className="p-4 sticky left-0 z-10 bg-zinc-900">Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
              {members.map((member) => {
                const isSelf = member.userId === currentUserId;
                const isTargetOwner = member.role === "OWNER";
                const isTargetAdmin = member.role === "ADMIN";

                // Determine if caller can remove the target member
                const canRemove =
                  !isSelf &&
                  !isTargetOwner &&
                  (isOwner || (isAdmin && !isTargetAdmin));

                // Determine if caller can change target role
                const canChangeRole = isOwner && !isSelf;

                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-zinc-900/10 transition-colors ${
                      isSelf ? "bg-indigo-950/10 text-white font-medium" : ""
                    }`}
                  >
                    <td className="p-4 flex items-center gap-3 sticky left-0 z-10 bg-zinc-900">
                      {member.user.avatarUrl ? (
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.name || "Member"}
                          className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 uppercase">
                          {member.user.name?.slice(0, 2) || member.user.email.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{member.user.name || "Workspace User"}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400 uppercase font-semibold border border-zinc-700/60">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-500 mt-0.5">{member.user.email}</div>
                      </div>
                    </td>

                    <td className="p-4">
                      {canChangeRole ? (
                        <div className="relative inline-block">
                          <select
                            value={member.role}
                            disabled={isPending}
                            onChange={(e) =>
                              handleRoleChange(member.userId, e.target.value as MembershipRole)
                            }
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer pr-8 appearance-none relative z-10"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-20" />
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${getRoleBadgeStyle(member.role)}`}>
                          {member.role}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-zinc-500">
                      {new Date(member.joinedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="p-4 text-right">
                      {canRemove && (
                        <button
                          disabled={isPending}
                          onClick={() => {
                            setMemberToRemove({
                              userId: member.userId,
                              email: member.user.email,
                            });
                            setRemoveConfirmOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Remove teammate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-850">
            <h2 className="text-sm font-bold text-white">Pending Invitations</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850/50 bg-zinc-900/10 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/50 text-zinc-300">
                {invitations.map((invite) => (
                  <tr key={invite.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="p-4 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-500" />
                      <span>{invite.email}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${getRoleBadgeStyle(invite.role)}`}>
                        {invite.role}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(invite.expiresAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {canInvite && (
                        <>
                          <button
                            disabled={isPending}
                            onClick={() => handleResendInvite(invite.id, invite.email)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-indigo-950/20 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Resend Invitation Email"
                          >
                            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => handleCancelInvite(invite.id, invite.email)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Cancel Invitation"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Dialog Overlay */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInviteModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200"
            >
              <button
                onClick={() => setInviteModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-2">Invite New Teammate</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Enter their email address and select a workspace role permission level.
              </p>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Workspace Role Permission
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as MembershipRole)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="MEMBER">MEMBER (View + Edit resources)</option>
                      <option value="ADMIN">ADMIN (Full invites + settings rights)</option>
                      <option value="VIEWER">VIEWER (Read-only workspace access)</option>
                    </select>
                    <ChevronDown className="h-4 w-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Send Invitation</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Member Confirm Dialog */}
      <AnimatePresence>
        {removeConfirmOpen && memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRemoveConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl z-10 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950/50 text-red-500 border border-red-800/40 mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Remove Team Member?</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Are you absolutely sure you want to remove <strong>{memberToRemove.email}</strong> from this workspace? They will lose access to all assets immediately.
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setRemoveConfirmOpen(false)}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleRemoveMember}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-red-650 hover:bg-red-650/80 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Removal</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
