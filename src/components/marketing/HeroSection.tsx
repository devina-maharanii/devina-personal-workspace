"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Play, Star, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const founderAvatars = ["N", "S", "A", "P"];

/**
 * HeroSection renders the primary viewport fold of the landing page.
 * Staggers entrance cards, shows social reviews, CTAs, and a CSS/SVG dashboard mockup.
 */
export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28 lg:py-36 text-foreground w-full">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.25]" />

      {/* Radial Glow Highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-primary/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center justify-between gap-12 xl:gap-16"
        >
          {/* Text Left Column */}
          <div className="flex-1 space-y-8 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            {/* Top Micro-badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary dark:text-indigo-300 shadow-sm shadow-primary/10">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Introducing Antigravity SaaS Boilerplate</span>
              </span>
            </motion.div>

            {/* Gradient Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-[-0.04em] leading-[0.98] text-foreground"
            >
              Ship Your SaaS Idea{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient-slow">
                In Hours, Not Weeks
              </span>
            </motion.h1>

            {/* Subtitle description */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl"
            >
              The Next.js 16 boilerplate that includes database structures, Stripe subscriptions, Gemini AI APIs, rate-limits, and modern dashboards to help you build at lightspeed.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              {[
                "Clerk auth",
                "Stripe billing",
                "Gemini AI",
                "Prisma + Postgres",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {item}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 px-6 py-3.5 font-bold text-sm text-white dark:text-zinc-950 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/#demo"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 px-6 py-3.5 font-bold text-sm text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-muted-foreground text-muted-foreground" />
                <span>View Demo</span>
              </Link>
            </motion.div>

            {/* Social Proof Stats */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 border-t border-border"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {founderAvatars.map((label, i) => (
                    <div
                      key={label}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 border-background shrink-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm"
                      )}
                      style={{ zIndex: founderAvatars.length - i }}
                    />
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xxs text-muted-foreground font-semibold mt-0.5">
                    Loved by 1,200+ founders
                  </span>
                </div>
              </div>

              <div className="h-8 w-px bg-border" />

              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                <Star className="h-4.5 w-4.5 text-primary fill-primary/20" />
                <span>
                  <strong>10k+</strong> Stars on GitHub
                </span>
              </div>
            </motion.div>
          </div>

          {/* Graphical Mockup Right Column */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none relative aspect-[4/3] rounded-2xl border border-border bg-card/40 p-3 shadow-2xl backdrop-blur-md">
            {/* Simulated Browser Header */}
            <div className="flex items-center gap-1.5 border-b border-border pb-3 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="ml-3 text-xxs font-mono text-muted-foreground/80 bg-background px-2 py-0.5 rounded">
                app.antigravity.io/dashboard
              </span>
            </div>

            {/* Dashboard Contents Mockup */}
            <div className="h-[80%] rounded-xl bg-background/90 p-4 space-y-4 overflow-hidden relative border border-border">
              {/* Header inside Mockup */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="h-3 w-24 bg-secondary rounded" />
                <div className="h-5 w-5 rounded-full bg-secondary" />
              </div>

              {/* Grid inside Mockup */}
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 bg-card rounded-xl space-y-2 border border-border">
                    <div className="h-2 w-12 bg-secondary rounded" />
                    <div className="h-4 w-16 bg-primary/20 rounded" />
                  </div>
                ))}
              </div>

              {/* Large Chart inside Mockup */}
              <div className="p-4 bg-card/50 rounded-xl border border-border h-32 flex flex-col justify-end space-y-3">
                <div className="h-2 w-32 bg-secondary rounded self-start" />
                <div className="flex items-end justify-between h-16 gap-2 pt-2">
                  {[40, 65, 35, 75, 50, 90, 60, 80, 45, 95].map((val, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ duration: 1.5, delay: i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/60 rounded-sm"
                    />
                  ))}
                </div>
              </div>

              {/* Floating micro-animated cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-20 right-6 p-3 rounded-2xl bg-card/95 border border-border shadow-2xl flex items-center gap-2 max-w-[190px] backdrop-blur"
              >
                <div className="h-6 w-6 rounded bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-emerald-555 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-foreground">Stripe Active</span>
                  <span className="text-[9px] text-muted-foreground">Subscription Verified</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-6 left-6 p-3 rounded-2xl bg-card/95 border border-border shadow-2xl flex items-center gap-2 max-w-[190px] backdrop-blur"
              >
                <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-foreground">Gemini-1.5 AI</span>
                  <span className="text-[9px] text-muted-foreground">Query processed</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Animated Stats Bar Below Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 sm:mt-24 border-t border-b border-border py-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xxs sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase text-center"
        >
          <span>✦ 14-day free trial</span>
          <span className="hidden sm:inline">·</span>
          <span>✦ No credit card required</span>
          <span className="hidden sm:inline">·</span>
          <span>✦ Cancel anytime online</span>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
