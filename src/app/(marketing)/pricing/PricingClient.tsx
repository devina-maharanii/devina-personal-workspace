/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, HelpCircle, ChevronDown, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/clerk-client";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useUIStore } from "@/stores/uiStore";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Custom animation tokens matching project's animation styles
const FADE_IN = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const STAGGER = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const MARKETING_PLANS = {
  FREE: {
    name: "Free",
    description: "Perfect for testing and small hobby projects.",
    price: 0,
    priceId: "price_free_placeholder",
    priceIdAnnual: "price_free_placeholder_annual",
    features: [
      "50 AI credits per month",
      "Basic text generation model",
      "Standard email support",
      "Single project seat",
      "1GB media storage",
    ],
  },
  PRO: {
    name: "Pro",
    description: "For professionals needing unlimited scale.",
    price: 29,
    priceId: "price_1ProPlan_Placeholder",
    priceIdAnnual: "price_1ProPlanAnnual_Placeholder",
    features: [
      "1,000 AI credits per month",
      "Access to advanced Gemini 1.5 Pro model",
      "Priority 24/7 support",
      "Up to 5 project seats",
      "10GB media storage",
      "Custom domain support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "Custom solutions for large scale organizations.",
    price: 99,
    priceId: "price_1EnterprisePlan_Placeholder",
    priceIdAnnual: "price_1EnterprisePlanAnnual_Placeholder",
    features: [
      "10,000 AI credits per month",
      "Dedicated custom models & fine-tuning",
      "Dedicated account manager",
      "Up to 50 project seats",
      "100GB media storage",
      "Custom integrations & webhooks",
    ],
  },
} as const;

/**
 * Custom Accordion for FAQs to avoid external package setup issues
 */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left py-2 font-semibold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
      >
        <span className="text-sm sm:text-base flex items-center gap-2.5">
          <HelpCircle className="h-4.5 w-4.5 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300 shrink-0",
            isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2 pl-7 pb-2">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * PricingClient Component
 */
type PricingClientProps = {
  authEnabled?: boolean;
};

export default function PricingClient({ authEnabled = true }: PricingClientProps) {
  if (!authEnabled) {
    return <PricingClientFallback />;
  }

  return <PricingClientWithAuth />;
}

function PricingClientWithAuth() {
  const { isSignedIn } = useAuth();
  const { plan, isActive, isLoading, fetchSubscription } = useSubscriptionStore();
  const { billingInterval, setBillingInterval } = useUIStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Sync subscription state on mount if logged in
  useEffect(() => {
    if (isSignedIn) {
      fetchSubscription();
    }
  }, [isSignedIn, fetchSubscription]);

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(window.location.href)}`;
      return;
    }

    setLoadingAction(priceId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) throw new Error("Failed to start checkout");
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert(`Could not start checkout for ${planName}.`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleManageBilling = async () => {
    setLoadingAction("portal");
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create billing portal");
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert("Could not load billing portal. Please verify you have an active subscription.");
    } finally {
      setLoadingAction(null);
    }
  };

  const isAnnually = billingInterval === "annually";

  // FAQ mock list (8 common SaaS inquiries)
  const faqs = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time directly through your billing portal settings.",
    },
    {
      question: "What is included in the 14-day free trial?",
      answer: "The trial provides unlimited access to all features under the Pro tier, preloaded with 1,000 AI query credits to test out integrations.",
    },
    {
      question: "How does sliding rate limiting work?",
      answer: "Requests are limited using an optimized sliding window algorithm. If your traffic spikes, the Redis layer handles queue buffers seamlessly.",
    },
    {
      question: "Is my payment information secure?",
      answer: "Absolutely. All transactions are securely processed directly by Stripe. We never store or transmit your credit card details.",
    },
    {
      question: "What happens if I exhaust my monthly AI credits?",
      answer: "If you hit your credit limit, you can buy quick token top-ups or wait for your plan renewal cycle to reset your quota.",
    },
    {
      question: "Can I invite team members to my workspace?",
      answer: "Yes, the Pro plan supports up to 5 seats, while the Enterprise plan supports up to 50 user seats with configurable authorization roles.",
    },
    {
      question: "Is there a discount for annual billing?",
      answer: "Yes! Choosing annual billing gives you a 20% discount on both the Pro and Enterprise subscription tiers.",
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can click 'Manage Billing' to access the Stripe portal and cancel your plan instantly. Your service will remain active until the end of the billing period.",
    },
  ];

  return (
    <div className="relative isolate overflow-hidden bg-background text-foreground w-full flex flex-col justify-start transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_var(--color-indigo-900)_0%,_transparent_60%)] dark:opacity-20 opacity-40 pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 dark:opacity-15 pointer-events-none" />

      {/* Main Container */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 space-y-24">
        {/* 1. Header & Billing Toggle */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Pricing Plans
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Choose a plan that fits your stage of growth. Start with our free tier or upgrade to access advanced scaling tools.
          </p>

          {/* Toggle interval */}
          <div className="flex items-center gap-3 bg-secondary/60 border border-border p-1 rounded-2xl">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                !isAnnually ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {!isAnnually && (
                <motion.div
                  layoutId="pricing-tab"
                  className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/10"
                />
              )}
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("annually")}
              className={cn(
                "relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                isAnnually ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAnnually && (
                <motion.div
                  layoutId="pricing-tab"
                  className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/10"
                />
              )}
              <span>Annually</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-95">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 2. Pricing cards grid */}
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-stretch snap-x snap-mandatory pb-6 hide-scrollbar px-2 sm:px-0"
        >
          {/* FREE Tier Card */}
          <motion.div
            variants={FADE_IN}
            className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-center flex flex-col justify-between rounded-3xl p-8 border border-border bg-card/40 hover:bg-card/75 backdrop-blur-sm relative transition-all"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{MARKETING_PLANS.FREE.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{MARKETING_PLANS.FREE.description}</p>
              </div>

              <div className="flex items-baseline gap-1 text-foreground">
                <span className="text-4xl font-extrabold tracking-tight">$0</span>
                <span className="text-xs font-bold text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {MARKETING_PLANS.FREE.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5 items-center">
                    <Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="block w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-center text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className="block w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-center text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </motion.div>

          {/* PRO Tier Card (Recommended) */}
          <motion.div
            variants={FADE_IN}
            className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-center flex flex-col justify-between rounded-3xl p-8 border border-indigo-500/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-sm relative shadow-xl shadow-indigo-600/5 ring-1 ring-indigo-500/30 scale-100 md:scale-105 transition-all"
          >
            {/* Ribbon Label */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 border border-indigo-500/50 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Most Popular
            </span>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{MARKETING_PLANS.PRO.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{MARKETING_PLANS.PRO.description}</p>
              </div>

              <div className="flex items-baseline gap-1 text-foreground">
                <span className="text-4xl font-extrabold tracking-tight">
                  ${isAnnually ? MARKETING_PLANS.PRO.price - 6 : MARKETING_PLANS.PRO.price}
                </span>
                <span className="text-xs font-bold text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {MARKETING_PLANS.PRO.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5 items-center">
                    <Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              {isLoading ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-indigo-600 text-center text-xs font-bold text-white flex items-center justify-center cursor-not-allowed opacity-50"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </button>
              ) : isActive && plan.id === "pro" ? (
                <button
                  onClick={handleManageBilling}
                  disabled={loadingAction === "portal"}
                  className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-center text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction === "portal" && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                  <span>Manage Billing</span>
                </button>
              ) : isActive && plan.id === "enterprise" ? (
                <button
                  onClick={handleManageBilling}
                  disabled={loadingAction === "portal"}
                  className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-center text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction === "portal" && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                  <span>Manage Billing</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleCheckout(
                      isAnnually ? MARKETING_PLANS.PRO.priceIdAnnual : MARKETING_PLANS.PRO.priceId,
                      "Pro"
                    )
                  }
                  disabled={loadingAction !== null}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-center text-xs font-bold text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction === (isAnnually ? MARKETING_PLANS.PRO.priceIdAnnual : MARKETING_PLANS.PRO.priceId) && (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  )}
                  <span>Upgrade to Pro</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* ENTERPRISE Tier Card */}
          <motion.div
            variants={FADE_IN}
            className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-center flex flex-col justify-between rounded-3xl p-8 border border-border bg-card/40 hover:bg-card/75 backdrop-blur-sm relative transition-all"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{MARKETING_PLANS.ENTERPRISE.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{MARKETING_PLANS.ENTERPRISE.description}</p>
              </div>

              <div className="flex items-baseline gap-1 text-foreground">
                <span className="text-4xl font-extrabold tracking-tight">
                  ${isAnnually ? MARKETING_PLANS.ENTERPRISE.price - 20 : MARKETING_PLANS.ENTERPRISE.price}
                </span>
                <span className="text-xs font-bold text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {MARKETING_PLANS.ENTERPRISE.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5 items-center">
                    <Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              {isLoading ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-center text-xs font-bold flex items-center justify-center cursor-not-allowed opacity-50"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </button>
              ) : isActive && plan.id === "enterprise" ? (
                <button
                  onClick={handleManageBilling}
                  disabled={loadingAction === "portal"}
                  className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-center text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction === "portal" && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                  <span>Manage Billing</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleCheckout(
                      isAnnually ? MARKETING_PLANS.ENTERPRISE.priceIdAnnual : MARKETING_PLANS.ENTERPRISE.priceId,
                      "Enterprise"
                    )
                  }
                  disabled={loadingAction !== null}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-center text-xs font-bold text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction ===
                    (isAnnually ? MARKETING_PLANS.ENTERPRISE.priceIdAnnual : MARKETING_PLANS.ENTERPRISE.priceId) && (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  )}
                  <span>Upgrade to Enterprise</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* 3. Feature Comparison Table */}
        <div className="max-w-5xl mx-auto space-y-8 pt-12">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Compare Features & Specifications</h2>
            <p className="text-xs text-muted-foreground mt-2">Get details about credit allowances, access control limits, and support models.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card/20">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 sticky top-0 backdrop-blur-md">
                  <th className="p-4 font-bold text-muted-foreground">Features</th>
                  <th className="p-4 font-bold text-foreground">Free Plan</th>
                  <th className="p-4 font-bold text-foreground">Pro Plan</th>
                  <th className="p-4 font-bold text-foreground">Enterprise Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Section header: Core Limits */}
                <tr className="bg-muted/30 font-bold text-indigo-600 dark:text-indigo-400">
                  <td colSpan={4} className="p-3 pl-4">Core Quota Limits</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Monthly AI Credits</td>
                  <td className="p-4 text-muted-foreground">50 Credits</td>
                  <td className="p-4 text-foreground font-semibold">1,000 Credits</td>
                  <td className="p-4 text-foreground font-semibold">10,000 Credits</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Team Seats</td>
                  <td className="p-4 text-muted-foreground">1 Seat</td>
                  <td className="p-4 text-foreground font-semibold">5 Seats</td>
                  <td className="p-4 text-foreground font-semibold">50 Seats</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Media Storage</td>
                  <td className="p-4 text-muted-foreground">1 GB</td>
                  <td className="p-4 text-foreground font-semibold">10 GB</td>
                  <td className="p-4 text-foreground font-semibold">100 GB</td>
                </tr>

                {/* Section header: AI capabilities */}
                <tr className="bg-muted/30 font-bold text-indigo-600 dark:text-indigo-400">
                  <td colSpan={4} className="p-3 pl-4">AI Integration Engine</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Gemini 1.5 Text Gen</td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                  <td className="p-4 text-foreground/90">Custom fine-tuned models</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Structured JSON API Output</td>
                  <td className="p-4 text-muted-foreground/30"><X className="h-4 w-4" /></td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                </tr>

                {/* Section header: Workspace & Support */}
                <tr className="bg-muted/30 font-bold text-indigo-600 dark:text-indigo-400">
                  <td colSpan={4} className="p-3 pl-4">Workspace & Support</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Multi-tenant Accounts</td>
                  <td className="p-4 text-muted-foreground/30"><X className="h-4 w-4" /></td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Custom Domain Binding</td>
                  <td className="p-4 text-muted-foreground/30"><X className="h-4 w-4" /></td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                  <td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 text-foreground/90 font-semibold">Support SLA</td>
                  <td className="p-4 text-muted-foreground">Standard Email</td>
                  <td className="p-4 text-foreground font-semibold">Priority 24/7</td>
                  <td className="p-4 text-foreground font-semibold">Dedicated Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Frequently Asked Questions FAQ Accordions */}
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Everything you need to know about plans, trials, and invoices.</p>
          </div>

          <div className="border border-border bg-card/25 p-6 rounded-3xl divide-y divide-border">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

        {/* 5. Pricing CTA bottom banner */}
        <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-card/80 via-card/50 to-indigo-500/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/40 p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">
            Start Building In Minutes
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Deploy your secure Next.js 16 SaaS workspace immediately and verify all payment checkout links in Stripe's developer sandbox.
          </p>

          <div className="flex flex-col items-center gap-3">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 font-bold text-xs text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 font-bold text-xs text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Start Your 14-Day Trial</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-2">
              ✦ No credit card required to test free tier
            </span>
          </div>

          {/* Trust badges footer */}
          <div className="pt-8 border-t border-border mt-8 grid grid-cols-3 gap-4 text-center max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-foreground">SOC2 Type II</span>
              <span className="text-[9px] text-muted-foreground">Certified infrastructure</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-foreground">GDPR Compliant</span>
              <span className="text-[9px] text-muted-foreground">Isolated database storage</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-foreground">99.9% Uptime</span>
              <span className="text-[9px] text-muted-foreground">Edge serverless reliability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingClientFallback() {
  const { billingInterval, setBillingInterval } = useUIStore();
  const isAnnually = billingInterval === "annually";
  const faqs = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time through billing settings.",
    },
    {
      question: "What is included in the free trial?",
      answer: "The trial provides access to the Pro tier feature set with enough credits to evaluate the full workflow.",
    },
    {
      question: "Is my payment information secure?",
      answer: "All transactions are processed directly by Stripe. We never store or transmit card data on our servers.",
    },
    {
      question: "What happens if I hit my AI credit cap?",
      answer: "You can upgrade, wait for renewal, or expand usage with a higher plan depending on your needs.",
    },
    {
      question: "Can my team use the platform together?",
      answer: "Yes, plans scale from solo use to team collaboration with roles, memberships, and shared billing options.",
    },
    {
      question: "Do annual plans really save 20%?",
      answer: "Yes, the annual toggle reflects the discounted yearly pricing shown on the cards and comparison table.",
    },
  ];

  return (
    <div className="relative isolate overflow-hidden bg-background text-foreground w-full flex flex-col justify-start transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_var(--color-indigo-900)_0%,_transparent_60%)] dark:opacity-20 opacity-40 pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 dark:opacity-15 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 space-y-24">
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Pricing Plans
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Choose a plan that fits your stage of growth. Start with our free tier or upgrade to access advanced scaling tools.
          </p>

          <div className="flex items-center gap-3 bg-secondary/60 border border-border p-1 rounded-2xl">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                !isAnnually ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {!isAnnually && <div className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/10" />}
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("annually")}
              className={cn(
                "relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                isAnnually ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAnnually && <div className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/10" />}
              <span>Annually</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-95">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-stretch snap-x snap-mandatory pb-6 hide-scrollbar px-2 sm:px-0"
        >
          <motion.div variants={FADE_IN} className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-center flex flex-col justify-between rounded-3xl p-8 border border-border bg-card/40 hover:bg-card/75 backdrop-blur-sm relative transition-all">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{MARKETING_PLANS.FREE.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{MARKETING_PLANS.FREE.description}</p>
              </div>
              <div className="flex items-baseline gap-1 text-foreground">
                <span className="text-4xl font-extrabold tracking-tight">$0</span>
                <span className="text-xs font-bold text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {MARKETING_PLANS.FREE.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5 items-center">
                    <Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <Link href="/sign-up" className="block w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-center text-xs font-bold transition-all active:scale-95 cursor-pointer">
                Get Started Free
              </Link>
            </div>
          </motion.div>

          <motion.div variants={FADE_IN} className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-center flex flex-col justify-between rounded-3xl p-8 border border-indigo-500/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-sm relative shadow-xl shadow-indigo-600/5 ring-1 ring-indigo-500/30 scale-100 md:scale-105 transition-all">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 border border-indigo-500/50 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Most Popular
            </span>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{MARKETING_PLANS.PRO.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{MARKETING_PLANS.PRO.description}</p>
              </div>
              <div className="flex items-baseline gap-1 text-foreground">
                <span className="text-4xl font-extrabold tracking-tight">${isAnnually ? MARKETING_PLANS.PRO.price - 6 : MARKETING_PLANS.PRO.price}</span>
                <span className="text-xs font-bold text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {MARKETING_PLANS.PRO.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5 items-center">
                    <Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <Link href="/sign-up" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-center text-xs font-bold text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                <span>Start 14-Day Trial</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </motion.div>

          <motion.div variants={FADE_IN} className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-center flex flex-col justify-between rounded-3xl p-8 border border-border bg-card/40 hover:bg-card/75 backdrop-blur-sm relative transition-all">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{MARKETING_PLANS.ENTERPRISE.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{MARKETING_PLANS.ENTERPRISE.description}</p>
              </div>
              <div className="flex items-baseline gap-1 text-foreground">
                <span className="text-4xl font-extrabold tracking-tight">${isAnnually ? MARKETING_PLANS.ENTERPRISE.price - 20 : MARKETING_PLANS.ENTERPRISE.price}</span>
                <span className="text-xs font-bold text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {MARKETING_PLANS.ENTERPRISE.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5 items-center">
                    <Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <Link href="/sign-up" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-center text-xs font-bold text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                <span>Talk to Sales</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-8 pt-12">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Compare Features & Specifications</h2>
            <p className="text-xs text-muted-foreground mt-2">Get details about credit allowances, access control limits, and support models.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card/20">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 sticky top-0 backdrop-blur-md">
                  <th className="p-4 font-bold text-muted-foreground">Features</th>
                  <th className="p-4 font-bold text-foreground">Free Plan</th>
                  <th className="p-4 font-bold text-foreground">Pro Plan</th>
                  <th className="p-4 font-bold text-foreground">Enterprise Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-muted/30 font-bold text-indigo-600 dark:text-indigo-400">
                  <td colSpan={4} className="p-3 pl-4">Core Quota Limits</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Monthly AI Credits</td><td className="p-4 text-muted-foreground">50 Credits</td><td className="p-4 text-foreground font-semibold">1,000 Credits</td><td className="p-4 text-foreground font-semibold">10,000 Credits</td></tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Team Seats</td><td className="p-4 text-muted-foreground">1 Seat</td><td className="p-4 text-foreground font-semibold">5 Seats</td><td className="p-4 text-foreground font-semibold">50 Seats</td></tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Media Storage</td><td className="p-4 text-muted-foreground">1 GB</td><td className="p-4 text-foreground font-semibold">10 GB</td><td className="p-4 text-foreground font-semibold">100 GB</td></tr>
                <tr className="bg-muted/30 font-bold text-indigo-600 dark:text-indigo-400"><td colSpan={4} className="p-3 pl-4">AI Integration Engine</td></tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Gemini 1.5 Text Gen</td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td><td className="p-4 text-foreground/90">Custom fine-tuned models</td></tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Structured JSON API Output</td><td className="p-4 text-muted-foreground/30"><X className="h-4 w-4" /></td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td></tr>
                <tr className="bg-muted/30 font-bold text-indigo-600 dark:text-indigo-400"><td colSpan={4} className="p-3 pl-4">Workspace & Support</td></tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Multi-tenant Accounts</td><td className="p-4 text-muted-foreground/30"><X className="h-4 w-4" /></td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td></tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Custom Domain Binding</td><td className="p-4 text-muted-foreground/30"><X className="h-4 w-4" /></td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td><td className="p-4 text-muted-foreground"><Check className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /></td></tr>
                <tr className="hover:bg-muted/10 transition-colors"><td className="p-4 pl-6 text-foreground/90 font-semibold">Support SLA</td><td className="p-4 text-muted-foreground">Standard Email</td><td className="p-4 text-foreground font-semibold">Priority 24/7</td><td className="p-4 text-foreground font-semibold">Dedicated Manager</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Everything you need to know about plans, trials, and invoices.</p>
          </div>

          <div className="border border-border bg-card/25 p-6 rounded-3xl divide-y divide-border">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-card/80 via-card/50 to-indigo-500/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/40 p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">Start Building In Minutes</h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Deploy your secure Next.js 16 SaaS workspace immediately and verify all payment checkout links in Stripe's developer sandbox.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 font-bold text-xs text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer">
              <span>Start Your 14-Day Trial</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-2">✦ No credit card required to test free tier</span>
          </div>

          <div className="pt-8 border-t border-border mt-8 grid grid-cols-3 gap-4 text-center max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-foreground">SOC2 Type II</span>
              <span className="text-[9px] text-muted-foreground">Certified infrastructure</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-foreground">GDPR Compliant</span>
              <span className="text-[9px] text-muted-foreground">Isolated database storage</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-foreground">99.9% Uptime</span>
              <span className="text-[9px] text-muted-foreground">Edge serverless reliability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
