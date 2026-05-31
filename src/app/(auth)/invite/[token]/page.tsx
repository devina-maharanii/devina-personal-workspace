import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AcceptInviteClient from "@/components/team/AcceptInviteClient";
import { SignUp } from "@/lib/clerk-client";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";


export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;

  const isPreview =
    process.env.NODE_ENV !== "production" &&
    (process.env.FORCE_MOCK_AUTH === "true" || process.env.E2E_TEST_MODE === "true");

  // 1. Resolve invitation details
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      organization: true,
      invitedBy: true,
    },
  });

  // Invalid, accepted, or expired status screens
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col items-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950/50 text-red-500 border border-red-800/40 mb-4 animate-pulse">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Invitation Invalid or Expired</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            This invitation link is invalid, has expired, or was already accepted by a teammate. Please ask your administrator for a new invite.
          </p>
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Check auth status
  const user = await getCurrentUser();

  // 3. Render Guest acceptance (Signup required)
  if (!user) {
    const features = [
      {
        title: "Collaborative Workspace",
        description: `Join other members inside the organization workspace: ${invitation.organization.name}.`,
      },
      {
        title: "Contextual AI Suite",
        description: "Access shared Claude 3.5 AI prompts, document summarizers, and alt-text generator tools.",
      },
      {
        title: "Shared Credit Pool",
        description: "Invoke team-allocated billing tokens with automatic credit enforcement.",
      },
    ];

    const currentUrl = `/invite/${token}`;

    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-950 text-white font-sans select-none">
        {/* Left Side: Invitation details */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950/40 relative overflow-hidden border-r border-zinc-800/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--color-indigo-950)_0%,_transparent_50%)] opacity-40 pointer-events-none" />

          {/* Brand Header */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <Sparkles className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Antigravity AI
            </span>
          </div>

          {/* Invitation info */}
          <div className="space-y-8 z-10 my-auto">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
                Workspace Invite Pending
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
                Join {invitation.organization.name}
              </h2>
              <p className="text-zinc-400 text-sm max-w-md">
                You have been invited by <strong className="text-white">{invitation.invitedBy.email}</strong> as an {invitation.role.toUpperCase()}. Create your account to join the team workspace.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-sm"
                >
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-600 z-10">
            &copy; {new Date().getFullYear()} Antigravity AI. All rights reserved.
          </div>
        </div>

        {/* Right Side: Clerk Sign Up Form */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-indigo-950)_0%,_transparent_70%)] opacity-30 lg:hidden pointer-events-none" />

          {/* Top Header for mobile */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-6 text-center z-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Antigravity AI</span>
            <p className="text-xs text-zinc-400 mt-2 px-6">
              You are invited to join <strong>{invitation.organization.name}</strong> workspace. Register below.
            </p>
          </div>

          <div className="w-full max-w-md z-10 flex justify-center">
            {isPreview ? (
              <div className="text-center p-8 border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl rounded-2xl w-full">
                <h2 className="text-xl font-bold text-white mb-2">Sign up disabled in preview mode</h2>
                <p className="text-xs text-zinc-450 mt-2">Start the dev server without preview mode or add Clerk keys to join the team workspace.</p>
              </div>
            ) : (
              <SignUp
                signInUrl="/sign-in"
                forceRedirectUrl={currentUrl}
                fallbackRedirectUrl={currentUrl}
                appearance={{
                  variables: {
                    colorPrimary: "#6366f1",
                    colorBackground: "#18181b",
                    colorInputBackground: "#09090b",
                    colorInputText: "#ffffff",
                    colorText: "#f4f4f5",
                    colorTextSecondary: "#a1a1aa",
                    colorDanger: "#ef4444",
                    borderRadius: "12px",
                  },
                  elements: {
                    card: "shadow-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl w-full",
                    headerTitle: "text-2xl font-bold tracking-tight text-white",
                    headerSubtitle: "text-sm text-zinc-400",
                    socialButtonsBlockButton: "bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-200 transition-all font-medium",
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300",
                    dividerLine: "bg-zinc-800",
                    dividerText: "text-zinc-500",
                    formFieldLabel: "text-zinc-300",
                    formFieldInput: "border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white bg-zinc-950",
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated acceptance screen
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 shadow-inner">
          <Sparkles className="h-6 w-6" />
        </div>

        <AcceptInviteClient
          token={token}
          orgName={invitation.organization.name}
          invitedByEmail={invitation.invitedBy.email}
        />
      </div>
    </div>
  );
}
