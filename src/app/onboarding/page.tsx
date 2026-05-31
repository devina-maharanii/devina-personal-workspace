/* eslint-disable react-hooks/purity */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
 
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@/lib/clerk-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  UploadCloud,
  Check,
  Users,
  Eye,
  Building,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Gift,
  Plus,
  Trash2,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import {
  checkSlugAvailability,
  createOrganization,
  updateOnboardingStep,
} from "@/lib/actions/organization";
import { inviteMember } from "@/lib/actions/team";
import posthog from "posthog-js";
import { ANALYTICS_EVENTS } from "@/lib/constants";
import type { MembershipRole } from "@prisma/client";

const INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Life Sciences",
  "Financial Services",
  "E-commerce & Retail",
  "Marketing & Advertising",
  "Education",
  "Other Industry",
];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function OnboardingPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoaded && user) {
      posthog.capture(ANALYTICS_EVENTS.ONBOARDING_STARTED);
    }
  }, [isUserLoaded, user]);

  // --- STEP 1 STATE: Workspace Creation ---
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [industry, setIndustry] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugError, setSlugError] = useState("");

  // --- STEP 2 STATE: Plan Selection ---
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("PRO");

  // --- STEP 3 STATE: Team Invites ---
  const [invites, setInvites] = useState<{ email: string; role: "ADMIN" | "MEMBER" }[]>([
    { email: "", role: "MEMBER" },
  ]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- STEP 4 STATE: Celebration & Checklist ---
  const [checklist, setChecklist] = useState({
    workspaceCreated: true,
    planSelected: true,
    teamInvited: false,
    dashboardExplored: false,
  });

  // --- UploadThing Integrator ---
  const { startUpload, isUploading } = useUploadThing("avatarUpload", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) {
        setLogoUrl(url);
        toast.success("Workspace logo uploaded!");
      }
    },
    onUploadError: (err) => {
      toast.error(getErrorMessage(err, "Failed to upload logo."));
    },
  });

  // Auto-generate slug from organization name
  useEffect(() => {
    if (step === 1 && orgName) {
      const generated = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  }, [orgName, step]);

  // Debounced slug availability checker
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await checkSlugAvailability(slug);
        if (res.available) {
          setSlugStatus("available");
          setSlugError("");
        } else {
          setSlugStatus("taken");
          setSlugError(res.reason || "Slug is already registered");
        }
      } catch (_err: unknown) {
        setSlugStatus("taken");
        setSlugError("Failed to verify slug availability");
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [slug]);

  // File logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    await startUpload(files);
  };

  // Submit Step 1: Create Organization
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return toast.error("Please enter a workspace name");
    if (slugStatus !== "available") return toast.error("Please choose an available URL slug");
    if (!industry) return toast.error("Please select an industry sector");

    startTransition(async () => {
      try {
        const org = await createOrganization({
          name: orgName,
          slug,
          logoUrl,
          industry,
        });
        setOrgId(org.id);
        toast.success(`Workspace "${org.name}" created!`);
        posthog.capture(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, { step: 1 });
        setStep(2);
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to instantiate organization"));
      }
    });
  };

  // Submit Step 2: Plan Selection
  const handleSelectPlan = (plan: "FREE" | "PRO" | "ENTERPRISE") => {
    setSelectedPlan(plan);
    toast.success(`Selected ${plan} plan tier!`);
    posthog.capture(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, { step: 2 });
    setStep(3);
  };

  // Step 3 Invite Controls
  const handleAddInvite = () => {
    if (invites.length >= 3) return toast.error("You can invite up to 3 teammates in onboarding");
    setInvites([...invites, { email: "", role: "MEMBER" }]);
  };

  const handleRemoveInvite = (index: number) => {
    const updated = [...invites];
    updated.splice(index, 1);
    setInvites(updated);
  };

  const handleInviteChange = (index: number, field: "email" | "role", value: string) => {
    const updated = [...invites];
    updated[index] = { ...updated[index], [field]: value };
    setInvites(updated);
  };

  // Submit Step 3: Send Invites
  const handleSendInvites = async () => {
    if (!orgId) return toast.error("No active organization found");

    const validInvites = invites.filter((inv) => inv.email.trim() && inv.email.includes("@"));

    if (validInvites.length > 0) {
      startTransition(async () => {
        try {
          // Fire invite Member server actions sequentially
          for (const invite of validInvites) {
             
            await inviteMember(invite.email, invite.role as MembershipRole, orgId);
          }
          toast.success(`Dispatched ${validInvites.length} team invitations!`);
          setChecklist((prev) => ({ ...prev, teamInvited: true }));
          posthog.capture(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, { step: 3 });
          setStep(4);
         
        } catch (err: unknown) {
          toast.error(getErrorMessage(err, "Failed to dispatch invitations"));
        }
      });
    } else {
      // Bypassed with zero invites
      posthog.capture(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, { step: 3 });
      setStep(4);
    }
  };

  // Submit Step 4: Finish & Redirect
  const handleCompleteOnboarding = async () => {
    if (!orgId) return router.push("/dashboard");

    startTransition(async () => {
      try {
        await updateOnboardingStep(orgId, 4);
        
        // Track completed onboard metrics in PostHog
        posthog.capture(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
          orgId,
          plan: selectedPlan,
          industry,
          invited_members: invites.filter(i => i.email).length > 0
        });

        toast.success("Welcome aboard!");
        router.push("/dashboard");
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to finalize onboarding configuration"));
      }
    });
  };

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center overflow-x-hidden py-12 px-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Immersive Glowing Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-800/10 blur-[120px] pointer-events-none" />

      {/* Floating Particles Celebration for final step */}
      {step === 4 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-indigo-500/20"
              initial={{
                x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 1000,
                y: typeof window !== "undefined" ? window.innerHeight + 10 : 800,
                scale: Math.random() * 1.5 + 0.5,
              }}
              animate={{
                y: -20,
                x: `calc(${Math.random() * 100}vw)`,
                rotate: 360,
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* Wizard Content Block */}
      <div className="w-full max-w-3xl z-10">
        
        {/* Header Branding */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-black text-indigo-500 select-none">▲</span>
            <span className="font-extrabold tracking-tight text-lg">Antigravity SaaS</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded-full font-bold">WIZARD</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900/50 hover:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>

        {/* Dynamic Horizontal Progress Stepper */}
        <div className="mb-10 w-full bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-850 -translate-y-1/2 z-0" />
            <motion.div
              className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />

            {[
              { num: 1, label: "Workspace" },
              { num: 2, label: "Pricing Tier" },
              { num: 3, label: "Team Invite" },
              { num: 4, label: "Launch" },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center z-10">
                <motion.div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-sm transition-all duration-300 ${
                    step >= s.num
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  }`}
                  animate={{ scale: step === s.num ? 1.1 : 1 }}
                >
                  {step > s.num ? <Check className="h-4.5 w-4.5" /> : s.num}
                </motion.div>
                <span
                  className={`text-[10px] mt-2 font-semibold uppercase tracking-wider ${
                    step >= s.num ? "text-indigo-400 font-bold" : "text-zinc-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps Switcher */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-900/60 border border-zinc-850 p-8 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 text-indigo-500/5 select-none pointer-events-none font-black text-9xl">
                01
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  Step 1: Set Up Workspace
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                  Build Your Digital Workspace
                </h2>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-xl">
                  Let's launch a premium shared portal for your team. You'll upload your brand logo, configure a custom subdomain, and select your primary industry.
                </p>

                <form onSubmit={handleCreateWorkspace} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-zinc-500" /> Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corporation"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-all"
                    />
                  </div>

                  {/* Slug Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Workspace URL Subdomain
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-xs font-semibold text-zinc-500 select-none">
                        antigravity.sh/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="acme-labs"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-26 pr-12 py-3 text-sm text-zinc-100 outline-none transition-all"
                      />
                      
                      {/* Slug Verification Indicator */}
                      <div className="absolute right-4 flex items-center">
                        {slugStatus === "checking" && (
                          <Loader2 className="h-4 w-4 text-zinc-500 animate-spin" />
                        )}
                        {slugStatus === "available" && (
                          <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold px-2 py-0.5 rounded-md">
                            AVAILABLE
                          </span>
                        )}
                        {slugStatus === "taken" && (
                          <span className="text-[10px] bg-red-950 border border-red-900/60 text-red-400 font-bold px-2 py-0.5 rounded-md">
                            TAKEN
                          </span>
                        )}
                      </div>
                    </div>
                    {slugError && (
                      <p className="text-xs text-red-400 font-semibold">{slugError}</p>
                    )}
                  </div>

                  {/* Industry Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Primary Industry
                    </label>
                    <select
                      required
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 rounded-xl px-4 py-3 text-sm text-zinc-300 outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select industry...</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  {/* Logo Upload Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Workspace Brand Logo (Optional)
                    </label>
                    <div className="flex items-center gap-4 p-4 bg-zinc-950/50 border border-zinc-850 rounded-2xl">
                      <div className="relative h-14 w-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="object-cover h-full w-full" />
                        ) : (
                          <Building className="h-6 w-6 text-zinc-650" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="h-4.5 w-4.5 text-indigo-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="relative inline-block cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            className="flex items-center gap-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 rounded-xl transition-all"
                          >
                            <UploadCloud className="h-3.5 w-3.5 text-zinc-400" />
                            {logoUrl ? "Change Logo" : "Upload Brand Image"}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                          Recommended format: Square JPG or PNG. Max size: 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isPending || isUploading || slugStatus !== "available"}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Configuring Workspace...
                        </>
                      ) : (
                        <>
                          Configure & Continue
                          <ArrowRight className="h-4.5 w-4.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-900/60 border border-zinc-850 p-8 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 text-indigo-500/5 select-none pointer-events-none font-black text-9xl">
                02
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                  <Gift className="h-3.5 w-3.5" />
                  Step 2: Choose Billing Tier
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                  Select Your Resource Limits
                </h2>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-xl">
                  Empower your workflows with the precise limit tier. Start with the free tier to explore core elements, or unlock the full capacity of our models immediately.
                </p>

                {/* Plan Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  
                  {/* Plan Card 1: FREE */}
                  <div
                    onClick={() => setSelectedPlan("FREE")}
                    className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                      selectedPlan === "FREE"
                        ? "bg-zinc-950 border-indigo-500 shadow-md shadow-indigo-500/5"
                        : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                        Individual
                      </span>
                      <h4 className="text-lg font-black text-zinc-100">Starter Free</h4>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                        Perfect for solo developers testing out core functionalities.
                      </p>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-black">$0</span>
                        <span className="text-xs text-zinc-500 ml-1">/mo</span>
                      </div>
                      <div className="h-0.5 bg-zinc-900 my-4" />
                      <ul className="space-y-2 text-[10px] text-zinc-400">
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> 100 AI Credits</li>
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> 5 Team Members</li>
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> 2GB Storage limit</li>
                      </ul>
                    </div>
                  </div>

                  {/* Plan Card 2: PRO */}
                  <div
                    onClick={() => setSelectedPlan("PRO")}
                    className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                      selectedPlan === "PRO"
                        ? "bg-indigo-950/15 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-bold px-3.5 py-1 rounded-bl-xl uppercase tracking-widest">
                      RECOMMENDED
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                        Professional
                      </span>
                      <h4 className="text-lg font-black text-zinc-100">Pro Developer</h4>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                        Unlimited requests and team management capacities.
                      </p>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-black">$29</span>
                        <span className="text-xs text-zinc-500 ml-1">/mo</span>
                      </div>
                      <div className="h-0.5 bg-zinc-900 my-4" />
                      <ul className="space-y-2 text-[10px] text-zinc-400">
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> 10,000 AI Credits</li>
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> 25 Team Members</li>
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> 64GB Storage limits</li>
                      </ul>
                    </div>
                  </div>

                  {/* Plan Card 3: ENTERPRISE */}
                  <div
                    onClick={() => setSelectedPlan("ENTERPRISE")}
                    className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                      selectedPlan === "ENTERPRISE"
                        ? "bg-zinc-950 border-indigo-500 shadow-md shadow-indigo-500/5"
                        : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                        Enterprise
                      </span>
                      <h4 className="text-lg font-black text-zinc-100">Scale Custom</h4>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                        Dedicated support pipelines and complete SLA guarantees.
                      </p>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-black">$99</span>
                        <span className="text-xs text-zinc-500 ml-1">/mo</span>
                      </div>
                      <div className="h-0.5 bg-zinc-900 my-4" />
                      <ul className="space-y-2 text-[10px] text-zinc-400">
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> Custom AI Credits</li>
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> Unlimited Members</li>
                        <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400" /> 256GB File limits</li>
                      </ul>
                    </div>
                  </div>

                </div>

                {/* Subtext info or premium redirect triggers */}
                {selectedPlan !== "FREE" ? (
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl mb-8 flex items-start gap-3">
                    <span className="text-lg">💳</span>
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs font-bold text-zinc-200 block mb-0.5">Stripe Billing Enabled</strong>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Choosing this tier prepares your Stripe subscription customer account. You can complete the checkout in a new window immediately, or proceed with the Free trial block and upgrade later inside Settings.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-2xl mb-8 flex items-start gap-3">
                    <span className="text-lg">🎉</span>
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs font-bold text-zinc-200 block mb-0.5">Explore with Starter Free Plan</strong>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        No credit card required. Explore our models and file modules instantly. Upgrading remains a simple 1-click step inside Settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Button controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {selectedPlan !== "FREE" ? (
                    <>
                      <a
                        href="https://buy.stripe.com/mock-onboarding-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-center"
                        onClick={() => {
                          toast.info("Mock Stripe Checkout opened in new window!");
                        }}
                      >
                        Upgrade via Stripe
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleSelectPlan(selectedPlan)}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-extrabold text-sm py-4 rounded-xl transition-all"
                      >
                        Continue with Free Trial
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan("FREE")}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg transition-all"
                    >
                      Confirm Free Selection
                      <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-900/60 border border-zinc-850 p-8 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 text-indigo-500/5 select-none pointer-events-none font-black text-9xl">
                03
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                  <Users className="h-3.5 w-3.5" />
                  Step 3: Invite Your Team
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                  Bring Your Collaborators
                </h2>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-xl">
                  Add up to 3 core teammates to access this workspace. They will automatically receive a beautiful invitation to register.
                </p>

                {/* Email Fields List */}
                <div className="space-y-4 mb-6">
                  {invites.map((inv, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input
                        type="email"
                        placeholder="teammate@company.com"
                        value={inv.email}
                        onChange={(e) => handleInviteChange(idx, "email", e.target.value)}
                        className="flex-1 bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-all"
                      />
                      <select
                        value={inv.role}
                        onChange={(e) => handleInviteChange(idx, "role", e.target.value)}
                        className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-3 text-xs text-zinc-350 outline-none transition-all cursor-pointer"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {invites.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(idx)}
                          className="p-3 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-850 hover:border-red-900/60 text-zinc-500 hover:text-red-400 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-8">
                  <button
                    type="button"
                    onClick={handleAddInvite}
                    disabled={invites.length >= 3}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold hover:text-indigo-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Plus className="h-4 w-4" /> Add Another Email
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold hover:text-zinc-300 transition-colors bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 px-3.5 py-1.5 rounded-lg"
                  >
                    <Eye className="h-3.5 w-3.5 text-zinc-500" /> Preview Invitation Email
                  </button>
                </div>

                {/* Confirm actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-850">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSendInvites}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg transition-all"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending Invites...
                      </>
                    ) : (
                      <>
                        Send Invites & Continue
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setStep(4);
                      toast.success("Skipped invitations step!");
                    }}
                    className="sm:w-1/3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 font-extrabold text-sm py-4 rounded-xl transition-all"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-900/60 border border-zinc-850 p-8 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/10 via-transparent to-transparent pointer-events-none" />

              <div className="relative flex flex-col items-center">
                {/* Visual completion badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="h-16 w-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/10"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                  All Systems Fully Online!
                </h2>
                <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                  Congratulations! Your organization is fully configured. Welcome to the premier developer dashboard interface.
                </p>

                {/* Setup Checklist summary */}
                <div className="w-full max-w-md text-left bg-zinc-950/50 border border-zinc-850 p-5 rounded-2xl mb-8 space-y-3.5">
                  <strong className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 block mb-2">
                    Onboarding Setup Checklist
                  </strong>

                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center text-xs shrink-0 font-extrabold">✓</span>
                    <span className="text-xs text-zinc-350 line-through">Workspace successfully established</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center text-xs shrink-0 font-extrabold">✓</span>
                    <span className="text-xs text-zinc-350 line-through">Initial resource plan tier selected</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`h-5 w-5 rounded-lg flex items-center justify-center text-xs shrink-0 font-extrabold ${
                      checklist.teamInvited 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                        : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                    }`}>
                      {checklist.teamInvited ? "✓" : "2"}
                    </span>
                    <span className={`text-xs ${checklist.teamInvited ? "text-zinc-350 line-through" : "text-zinc-400 font-semibold"}`}>
                      Teammates invited to register
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg flex items-center justify-center text-xs shrink-0 font-extrabold">3</span>
                    <span className="text-xs text-zinc-400 font-semibold">Launch first document / asset upload</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg flex items-center justify-center text-xs shrink-0 font-extrabold">4</span>
                    <span className="text-xs text-zinc-400 font-semibold">Run your first AI chat generation session</span>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={isPending}
                  className="w-full max-w-md flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-indigo-600/15 transition-all"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Enter Dashboard Workspace
                      <ArrowRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Interactive Invite Email Preview */}
        <AnimatePresence>
          {isPreviewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
              >
                {/* Modal Title */}
                <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-zinc-900/80">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-350">
                      Invitation Email Live Preview
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300 font-extrabold text-sm hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800/80 transition-colors"
                  >
                    Close Preview
                  </button>
                </div>

                {/* Live rendered HTML Preview area */}
                <div className="flex-1 overflow-y-auto bg-zinc-950 p-6">
                  <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#09090b]">
                    {/* Simulated Browser Header */}
                    <div className="bg-[#0f0f11] px-4 py-3 border-b border-zinc-850 flex items-center gap-2">
                      <div className="flex gap-1.5 shrink-0">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                      </div>
                      <div className="flex-1 bg-zinc-900/80 text-[10px] text-zinc-500 py-1 px-3 rounded-md truncate select-all">
                        Subject: Invitation to join {orgName || "Acme Labs"} on Antigravity
                      </div>
                    </div>

                    {/* Email body representation */}
                    <div className="p-8 font-sans bg-[#09090b] text-[#a1a1aa] max-w-[580px] mx-auto text-xs leading-relaxed">
                      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#1f1f23]">
                        <span className="text-indigo-500 font-bold text-lg">▲</span>
                        <span className="text-[#fafafa] font-bold text-sm">Antigravity SaaS</span>
                      </div>

                      <h1 className="text-[#fafafa] font-black text-lg mb-4">You have been invited!</h1>
                      <p className="mb-4">
                        <strong>{user?.fullName || user?.primaryEmailAddress?.emailAddress || "Sarah Jenkins"}</strong> has invited you to join their team in the <strong className="text-[#fafafa]">{orgName || "Acme Labs"}</strong> workspace on Antigravity.
                      </p>

                      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 my-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg select-none">
                            {(orgName || "A").slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <strong className="text-[#fafafa] text-sm block">{orgName || "Acme Labs"}</strong>
                            <span className="text-[10px] text-[#71717a]">Team Workspace</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                          Join this workspace to collaborate on AI generation sessions, share secure document folders, inspect analytics charts, and manage developers assets.
                        </p>
                      </div>

                      <div className="h-[1px] bg-[#1f1f23] my-6" />

                      <div className="text-center my-6">
                        <span className="inline-block bg-[#4f46e5] border border-[#6366f1] text-white font-bold px-6 py-3 rounded-xl cursor-default">
                          Accept Invitation
                        </span>
                      </div>

                      <div className="bg-[#ef4444]/[0.03] border border-[#ef4444]/20 rounded-xl p-4 my-6 flex gap-2">
                        <span className="text-sm shrink-0">⚠️</span>
                        <span className="text-[10px] text-[#fca5a5] leading-relaxed">
                          This invitation was sent directly to your email address and will expire automatically in <strong>7 days</strong>. If you did not expect this invitation, you can safely ignore this email.
                        </span>
                      </div>

                      <p className="mt-8 mb-0">
                        Best regards,<br />
                        <strong>The Antigravity Team</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
