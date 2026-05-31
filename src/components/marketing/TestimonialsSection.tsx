/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

/**
 * TestimonialsSection renders customer review cards in a 3-column grid.
 * Staggers animations on viewport entrance.
 */
export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Jenkins",
      role: "CTO",
      company: "Acme Design",
      stars: 5,
      quote: "This boilerplate saved us over 40 hours of setup time. The Stripe integration is robust, and the multi-tenant configuration is exceptionally clean.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80",
    },
    {
      name: "Alex Mercer",
      role: "Founder",
      company: "SaaS Rocket",
      stars: 5,
      quote: "Implementing Clerk and Gemini APIs usually takes me days to configure correctly. With Antigravity, I had a working MVP deployed in one afternoon.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80",
    },
    {
      name: "Emily Watson",
      role: "Tech Lead",
      company: "ScaleDev",
      stars: 5,
      quote: "The Redis caching layer and rate limiting helpers work flawlessly out of the box. Essential resource for any developer shipping SaaS products.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80",
    },
  ];

  const gridVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  };

  return (
    <section className="bg-background py-20 sm:py-28 text-foreground w-full border-t border-border relative transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Loved By{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Developers & Founders
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            See why software creators choose Antigravity to build and launch their SaaS ideas.
          </p>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((test, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex flex-col justify-between transition-all hover:border-border/80 hover:bg-card/75 hover:shadow-lg hover:shadow-indigo-600/5"
            >
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex items-center">
                  {[...Array(test.stars)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                  "{test.quote}"
                </p>
              </div>

              {/* User Profile info */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border">
                <div
                  className="h-10 w-10 rounded-full bg-cover bg-center shrink-0 border border-border"
                  style={{ backgroundImage: `url('${test.avatar}')` }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{test.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {test.role} at {test.company}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
