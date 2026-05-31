import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Database,
  Cpu,
  ArrowRight,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Premium SaaS Features",
  description: "Accelerate development using pre-built modules for Clerk Authentication, Stripe Subscription billing, Prisma database schemas, and Google Gemini AI logic integrations.",
  canonical: "https://boilerplate-pro.com/features",
});

const features = [
  {
    id: "auth",
    name: "Clerk Authentication & Roles",
    tagline: "Secure, battle-tested login authentication",
    description:
      "Fully configured user sign-in flows with Clerk. Includes social login providers (Google, GitHub), multi-factor authorization, route protection middleware, and automatic database user syncing.",
    icon: ShieldCheck,
    benefits: [
      "Social & Passwordless sign-ins out-of-the-box",
      "Robust Middleware protecting dashboard and admin routes",
      "Automatic synchronization with DB users via secure webhooks",
    ],
    relatedId: "billing",
    relatedName: "Stripe Billing Integrations",
  },
  {
    id: "billing",
    name: "Stripe Billing & Portal Systems",
    tagline: "Ready-to-use checkout flows and portal redirects",
    description:
      "A complete billing solution supporting monthly/annual tiers, trial periods, and secure checkout sessions. Features an integrated Stripe Customer Portal allowing users to upgrade, downgrade, or cancel instantly.",
    icon: CreditCard,
    benefits: [
      "Zustand state synchronization for subscription states",
      "Stripe Webhook handler automatically updating local DB tables",
      "Support for multi-tier plans and billing cycles",
    ],
    relatedId: "database",
    relatedName: "Prisma Database Layer",
  },
  {
    id: "database",
    name: "Prisma & Postgres Database Sync",
    tagline: "High-speed schema design and audit logs",
    description:
      "Robust relational database integration powered by Prisma ORM and Postgres. Features schema definitions for posts, history rollbacks, user accounts, and subscription records with type-safe clients.",
    icon: Database,
    benefits: [
      "Fully typed database clients and relations schema",
      "Draft histories audit log system supporting version rollbacks",
      "Optimized query indexes ensuring high speed page generations",
    ],
    relatedId: "ai",
    relatedName: "Vertex AI Middleware Engine",
  },
  {
    id: "ai",
    name: "Vertex AI & Gemini Middleware",
    tagline: "Edge-speed structured inference pipelines",
    description:
      "Integrate Gemini LLM models into your application features. Features pre-built endpoints, system prompting frameworks, and structured outputs for rich AI assistance.",
    icon: Cpu,
    benefits: [
      "Pre-built route handlers for prompt inference requests",
      "Structured output mapping with Zod schema validation",
      "Edge-rendered responses and prompts processing",
    ],
    relatedId: "auth",
    relatedName: "Clerk Authentication & Roles",
  },
];

export default function FeaturesPage() {
  return (
    <div className="relative isolate overflow-hidden bg-zinc-950 text-white min-h-screen py-24 sm:py-32 font-sans">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-indigo-900)_0%,_transparent_65%)] opacity-20 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full">
            Technical Features
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Launch your SaaS product in hours, not weeks
          </h1>
          <p className="text-base sm:text-xl text-zinc-400 leading-relaxed">
            Every module is pre-wired, tested, and optimized for speed. Focus on building your core value proposition instead of auth, payments, or DB adapters.
          </p>
        </div>

        {/* Feature Sections */}
        <div className="space-y-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const isEven = idx % 2 === 0;

            return (
              <section
                key={feature.id}
                id={feature.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center border border-zinc-900 bg-zinc-900/10 p-8 sm:p-12 rounded-3xl relative overflow-hidden`}
              >
                {/* Glowing subtle mesh background per card */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(99,102,241,0.03),_transparent_70%)] pointer-events-none" />

                {/* Left/Right Text Detail */}
                <div className={`lg:col-span-6 space-y-6 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="inline-flex p-3 rounded-2xl bg-zinc-900 border border-zinc-850 text-indigo-400 shadow-md">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {feature.name}
                    </h2>
                    <p className="text-sm font-semibold text-indigo-400 mt-1">
                      {feature.tagline}
                    </p>
                  </div>
                  <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Bullet Benefits */}
                  <ul className="space-y-3 pt-2">
                    {feature.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Internal cross-linking of related features */}
                  <div className="pt-4 border-t border-zinc-900 flex items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-2">
                      Related:
                    </span>
                    <Link
                      href={`/features#${feature.relatedId}`}
                      className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {feature.relatedName}
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Mockup Frame */}
                <div className={`lg:col-span-6 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="relative border border-zinc-900 bg-zinc-950 p-6 rounded-2xl aspect-video overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none" />
                    
                    {/* Simulated browser dots */}
                    <div className="flex items-center gap-1.5 mb-6 border-b border-zinc-900 pb-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                      <span className="text-[10px] text-zinc-650 ml-4 font-mono select-none">localhost:3000/{feature.id}</span>
                    </div>

                    {/* Styled mock dashboard contents */}
                    <div className="space-y-4 font-mono text-[10px] text-zinc-500 select-none">
                      <div className="h-4 bg-zinc-900 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-zinc-900 rounded w-3/4" />
                      <div className="h-3 bg-zinc-900 rounded w-1/2" />
                      
                      {/* Accent highlight visual box */}
                      <div className="border border-indigo-950 bg-indigo-950/20 p-4 rounded-xl space-y-2 mt-4">
                        <div className="flex items-center justify-between text-indigo-400 font-bold">
                          <span>{feature.name.toUpperCase()} SYSTEM ACTIVE</span>
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="h-2.5 bg-indigo-900/30 rounded w-2/3" />
                        <div className="h-2.5 bg-indigo-900/30 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Global Conversion CTA Banner */}
        <div className="border border-zinc-900 bg-zinc-900/10 p-8 sm:p-16 rounded-3xl text-center relative overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)] pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stop repeating boilerplate code
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Unlock instant production readiness and launch your SaaS application on Vercel or App Hosting in record time.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 h-12 rounded-xl transition-all shadow-lg shadow-indigo-600/15 cursor-pointer"
            >
              <span>View Plans & Pricing</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border border-zinc-850 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-850 text-zinc-400 hover:text-white font-bold text-xs px-6 h-12 rounded-xl transition-colors cursor-pointer"
            >
              <span>Explore Home</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
