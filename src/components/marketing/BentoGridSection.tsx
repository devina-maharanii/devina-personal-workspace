/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import { Terminal, Activity, Lock, Wallet } from "lucide-react";

/**
 * BentoGridSection displays key SaaS benefits in an Apple-style grid layout.
 * Combines 2x2 and 4x2 modules styled with gradient highlights.
 */
export function BentoGridSection() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section className="bg-background py-20 sm:py-28 text-foreground w-full border-t border-border relative transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Optimized For{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Speed & Scale
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Everything is pre-optimized and configured to ensure maximum performance out of the box.
          </p>
        </div>

        {/* Bento Grid layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-6 gap-6"
        >
          {/* Card 1: Main Feature (spans 4 cols) */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-4 rounded-3xl border border-border bg-card/40 hover:bg-card/75 p-8 flex flex-col justify-between overflow-hidden relative group transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="space-y-4 max-w-md relative z-10">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Developer Springboard</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Antigravity comes with preconfigured ESLint directives, Prisma schemas, database migrations, and testing scripts. Run one command to deploy to production immediately.
              </p>
            </div>

            {/* Code editor mockup inside Bento */}
            <div className="mt-8 rounded-xl border border-border bg-secondary/60 dark:bg-zinc-950 p-4 font-mono text-[10px] text-muted-foreground space-y-1.5 shadow-md relative z-10">
              <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                <span className="text-[8px] text-muted-foreground/60 ml-2">lib/stripe.ts</span>
              </div>
              <div><span className="text-indigo-600 dark:text-indigo-400">const</span> stripe = <span className="text-indigo-600 dark:text-indigo-400">new</span> Stripe(process.env.STRIPE_SECRET_KEY);</div>
              <div><span className="text-indigo-600 dark:text-indigo-400">export const</span> PLANS = &#123;</div>
              <div className="pl-4">FREE: &#123; name: <span className="text-emerald-600 dark:text-emerald-400">"Free"</span>, price: 0 &#125;,</div>
              <div className="pl-4">PRO: &#123; name: <span className="text-emerald-600 dark:text-emerald-400">"Pro"</span>, price: 29 &#125;</div>
              <div>&#125;;</div>
            </div>
          </motion.div>

          {/* Card 2: Security (spans 2 cols) */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-2 rounded-3xl border border-border bg-card/40 hover:bg-card/75 p-8 flex flex-col justify-between overflow-hidden relative group transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 dark:text-purple-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Security First</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tokens, API secrets, and webhook signatures are guarded using strict validation schemas.
              </p>
            </div>

            {/* Visual Token Padlock */}
            <div className="mt-8 p-4 rounded-xl border border-border bg-secondary/50 flex items-center justify-between text-xs relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 dark:text-purple-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-foreground/80">clerk_jwt_key</span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                VALID
              </span>
            </div>
          </motion.div>

          {/* Card 3: Cache latency (spans 2 cols) */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-2 rounded-3xl border border-border bg-card/40 hover:bg-card/75 p-8 flex flex-col justify-between overflow-hidden relative group transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Global Speed</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sliding window rate limit checks complete in &lt;10ms via serverless Redis edge pools.
              </p>
            </div>

            {/* Visual latency meter */}
            <div className="mt-8 space-y-2 relative z-10">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase">
                <span>Response Time</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">2.4ms</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "92%" }}
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Checkout billing (spans 4 cols) */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-4 rounded-3xl border border-border bg-card/40 hover:bg-card/75 p-8 flex flex-col justify-between overflow-hidden relative group transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="space-y-4 max-w-md relative z-10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Stripe Billing Tiers</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure plan prices instantly. Generates Stripe checkout links and syncs plan status securely using robust webhooks.
              </p>
            </div>

            {/* Visual payment checkout card inside Bento */}
            <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
              <div className="p-4 rounded-xl border border-border bg-secondary/60 dark:bg-zinc-950 flex flex-col justify-between space-y-4 shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground">Pro Plan</span>
                  <div className="text-lg font-extrabold text-foreground">$29<span className="text-[10px] text-muted-foreground">/mo</span></div>
                </div>
                <div className="text-[9px] font-semibold text-muted-foreground/80">Includes 10k AI credits.</div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/60 dark:bg-zinc-950 flex flex-col justify-between space-y-4 shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground">Enterprise Plan</span>
                  <div className="text-lg font-extrabold text-foreground">$99<span className="text-[10px] text-muted-foreground">/mo</span></div>
                </div>
                <div className="text-[9px] font-semibold text-muted-foreground/80">Dedicated database pools.</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default BentoGridSection;
