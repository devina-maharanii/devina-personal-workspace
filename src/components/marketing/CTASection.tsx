"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * CTASection is the closing section on the landing page.
 * Highlights signup perks with vibrant gradient panels.
 */
export function CTASection() {
  return (
    <section className="bg-background py-20 sm:py-28 text-foreground w-full border-t border-border relative overflow-hidden transition-colors duration-300">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-indigo-500)_0%,_transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_var(--color-indigo-900)_0%,_transparent_60%)] opacity-5 dark:opacity-10 pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-card via-card to-indigo-500/5 dark:to-indigo-950/30 p-8 sm:p-16 text-center space-y-6 shadow-sm dark:shadow-none"
        >
          {/* Subtle micro-badge */}
          <div className="inline-flex items-center gap-1 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 rounded-full px-3 py-1 text-xxs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            <span>Ready to ship?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto">
            Start Building{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Today
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Deploy your secure Next.js SaaS template with Stripe payments and Gemini AI endpoints pre-configured.
          </p>

          <div className="flex flex-col items-center gap-4 pt-4">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 px-6 py-3 font-bold text-sm text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Get Started Instantly</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
              ✦ 14-Day Free Trial · No Credit Card Required
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTASection;
