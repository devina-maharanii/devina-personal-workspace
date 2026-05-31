"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Sparkles,
  CreditCard,
  Building2,
  FileCode2,
  BarChart3,
  Users,
  Mail,
  HardDrive,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

/**
 * FeaturesGrid displays the 9 core pillars of the boilerplate,
 * animating items on viewport entrance.
 */
export function FeaturesGrid() {
  const featuresList = [
    {
      icon: ShieldCheck,
      title: "Clerk Authentication",
      description: "Secure, reliable, and frictionless login flows including social auth, MFA, and JWT controls.",
      href: "/#auth",
    },
    {
      icon: Sparkles,
      title: "Gemini AI Core",
      description: "Pre-configured LLM chat queries and structured JSON output streaming setups.",
      href: "/#ai",
    },
    {
      icon: CreditCard,
      title: "Stripe Billing Engine",
      description: "Ready-to-use subscriptions, dynamic price lookups, portal hooks, and webhook handlers.",
      href: "/pricing",
    },
    {
      icon: Building2,
      title: "Multi-tenant Schemes",
      description: "Isolated database structures for organization workspace boundaries, memberships, and roles.",
      href: "/#multi-tenant",
    },
    {
      icon: FileCode2,
      title: "Blog & Content CMS",
      description: "Dynamic MDX blogging pages with search engine optimization hooks and schemas.",
      href: "/blog",
    },
    {
      icon: BarChart3,
      title: "PostHog Analytics",
      description: "Telemetry systems ready to capture user flows, custom events, and conversions.",
      href: "/#analytics",
    },
    {
      icon: Users,
      title: "Team Access Control",
      description: "Invite members, select role scopes, and restrict API permissions dynamically.",
      href: "/#teams",
    },
    {
      icon: Mail,
      title: "Resend Email Alerts",
      description: "Transactional templates mapping account verifications, billing flags, and announcements.",
      href: "/#emails",
    },
    {
      icon: HardDrive,
      title: "Storage buckets",
      description: "Optimized utilities to handle secure file and image uploads to databases.",
      href: "/#storage",
    },
  ];

  const gridVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  };

  return (
    <section id="features" className="bg-background py-20 sm:py-28 text-foreground w-full relative transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything You Need To{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Ship
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Stop stitching third-party setups together. Antigravity gives you a fully verified core foundation so you can build your product.
          </p>
        </div>

        {/* Staggered Grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuresList.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(99,102,241,0.12)" }}
                className="group relative flex flex-col p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/75"
              >
                {/* Icon Container */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary border border-border text-indigo-500 dark:text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-foreground mb-2">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex-1">
                  {feat.description}
                </p>

                {/* Learn More link */}
                <Link
                  href={feat.href}
                  className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground group/link transition-colors mt-auto cursor-pointer"
                >
                  <span>Learn more</span>
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 text-muted-foreground/60 group-hover:text-foreground" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesGrid;
