"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import { Sparkles, Send, Check } from "lucide-react";

// Inline SVG components for brand icons since they are removed from lucide-react in newer versions.
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    // Simulate subscribing via API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1200);
  };

  const socialLinks = [
    { name: "Twitter", href: "#", icon: TwitterIcon },
    { name: "GitHub", href: "https://github.com", icon: GithubIcon },
    { name: "YouTube", href: "https://youtube.com", icon: YoutubeIcon },
  ];

  return (
    <footer className="w-full bg-background text-muted-foreground py-16 relative mt-auto border-t border-border transition-colors duration-300">
      {/* Decorative gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Brand Column */}
        <div className="space-y-5 md:col-span-4">
          <div className="flex items-center gap-2 font-extrabold text-foreground text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span>{SITE_CONFIG.name}</span>
          </div>
          <p className="text-sm text-muted-foreground/80 max-w-sm leading-relaxed">
            {SITE_CONFIG.description || "The modern software-as-a-service application shell designed for performance, built to convert."}
          </p>
          {/* Social Links */}
          <div className="flex items-center gap-3 pt-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 shadow-sm cursor-pointer"
                  aria-label={social.name}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Product Column */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Product</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/pricing" className="inline-block text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-transform duration-200">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/#features" className="inline-block text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-transform duration-200">
                Features
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources Column */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Resources</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/blog" className="inline-block text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-transform duration-200">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/docs" className="inline-block text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-transform duration-200">
                Documentation
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Subscription Column */}
        <div className="space-y-4 md:col-span-4">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Stay Updated</h4>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Subscribe to our newsletter for product announcements and tech updates.
          </p>
          <form onSubmit={handleSubscribe} className="relative max-w-xs pt-1">
            <div className="relative flex items-center">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading" || status === "success"}
                className="w-full h-10 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 pl-4 pr-10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
                aria-label="Subscribe"
              >
                {status === "loading" ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : status === "success" ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            {status === "success" && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium animate-pulse flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Thank you for subscribing!
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Bottom Legal Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/75">
        <div>
          &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
