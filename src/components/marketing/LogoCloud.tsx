"use client";

import { motion } from "framer-motion";

/**
 * LogoCloud displays fake partner company logos.
 * Runs an infinite horizontal marquee styled in CSS with color change on hover.
 */
export function LogoCloud() {
  const logos = [
    { name: "Acme", icon: "▲" },
    { name: "Stripe", icon: "💳" },
    { name: "Vercel", icon: "▲" },
    { name: "Slack", icon: "💬" },
    { name: "Retool", icon: "⚡" },
    { name: "Supabase", icon: "⚡" },
  ];

  // Duplicate list to achieve seamless infinite loop scrolling
  const scrollLogos = [...logos, ...logos, ...logos];

  return (
    <section className="bg-background py-10 w-full overflow-hidden select-none border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-center text-xs font-bold text-muted-foreground/80 uppercase tracking-widest mb-6">
          Trusted by teams at
        </h3>
      </div>

      {/* Marquee scroll block */}
      <div className="relative flex w-full overflow-x-hidden">
        {/* Custom styles injected directly inside the component for zero tailwind config locks */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-33.33%); }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 25s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="animate-marquee gap-12 sm:gap-16">
          {scrollLogos.map((logo, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2 cursor-pointer transition-all duration-300 grayscale opacity-45 hover:grayscale-0 hover:opacity-100"
            >
              <span className="text-xl sm:text-2xl font-black text-foreground shrink-0">
                {logo.icon}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-muted-foreground hover:text-foreground tracking-tight">
                {logo.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LogoCloud;
