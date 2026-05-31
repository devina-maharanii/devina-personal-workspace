/* eslint-disable react/no-unescaped-entities */
"use client";

import { useTransition } from "react";
import { acceptInvitation } from "@/lib/actions/team";
import { useOrgStore } from "@/stores/orgStore";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface AcceptInviteClientProps {
  token: string;
  orgName: string;
  invitedByEmail: string;
}

export default function AcceptInviteClient({
  token,
  orgName,
  invitedByEmail,
}: AcceptInviteClientProps) {
  const [isPending, startTransition] = useTransition();
  const { setActiveOrgId } = useOrgStore();

  const handleAccept = () => {
    startTransition(async () => {
      try {
        const orgId = await acceptInvitation(token);
        // Set the active organization in store + cookie
        setActiveOrgId(orgId);
        toast.success(`Welcome! You are now a member of ${orgName}.`);
        // Redirect to dashboard
        window.location.href = "/dashboard";
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to accept invitation."));
      }
    });
  };

  return (
    <div className="space-y-6 w-full text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Join {orgName}
        </h2>
        <p className="text-sm text-zinc-400">
          You have been invited by <span className="text-white font-medium">{invitedByEmail}</span> to join their workspace.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
        By joining, you will be able to collaborate, share document summaries, invoke vision checks, and access the team's shared AI credit pool.
      </div>

      <div className="pt-2">
        <button
          disabled={isPending}
          onClick={handleAccept}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Accept & Join Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
