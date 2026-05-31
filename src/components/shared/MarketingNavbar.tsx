"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { UserButton } from "@/components/shared/UserButton";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { APP_NAME } from "@/lib/constants";

type MarketingNavbarProps = {
  authEnabled?: boolean;
};

/**
 * MarketingNavbar is a premium floating navigation bar for marketing routes.
 * Transitions to a floating capsule on scroll down, and active navigation section
 * triggers a spring-animated layout highlight.
 */
export function MarketingNavbar({ authEnabled = true }: MarketingNavbarProps) {
  if (!authEnabled) {
    return <MarketingNavbarFallback />;
  }

  return <MarketingNavbarWithAuth />;
}

function MarketingNavbarWithAuth() {
  const { isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      // Scroll spy logic for homepage
      if (pathname === "/") {
        const featuresSection = document.getElementById("features");
        if (!featuresSection) {
          setActiveLink("");
          return;
        }

        const rect = featuresSection.getBoundingClientRect();
        const threshold = 160; // offset in px

        if (rect.top <= threshold && rect.bottom >= threshold) {
          setActiveLink("/#features");
        } else {
          setActiveLink("");
        }
      }
    };

    // Set active link for other paths
    if (pathname !== "/") {
      if (pathname.startsWith("/pricing")) {
        setActiveLink("/pricing");
      } else if (pathname.startsWith("/blog")) {
        setActiveLink("/blog");
      } else if (pathname.startsWith("/docs")) {
        setActiveLink("/docs");
      } else {
        setActiveLink("");
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // run once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 py-3">
      <div
        className={cn(
          "mx-auto transition-all duration-300 px-4 sm:px-6 lg:px-8",
          scrolled
            ? "max-w-5xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] py-1"
            : "max-w-7xl bg-transparent border border-transparent py-1.5"
        )}
      >
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-extrabold text-zinc-900 dark:text-white text-lg tracking-tight hover:opacity-90 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/30 animate-pulse">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span>{APP_NAME}</span>
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = activeLink === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "relative text-sm font-semibold transition-colors px-4 py-2 rounded-xl",
                    isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavHighlightAuth"
                      className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl -z-10 shadow-[0_0_12px_rgba(99,102,241,0.12)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30 active:scale-95 cursor-pointer"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg overflow-hidden mx-auto mt-2 max-w-[calc(100%-2rem)] rounded-2xl shadow-xl"
          >
            <div className="space-y-1.5 px-4 pb-6 pt-3">
              {navLinks.map((link) => {
                const isActive = activeLink === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-base font-semibold transition-colors",
                      isActive
                        ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-650 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white border border-transparent"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 my-4" />

              {isSignedIn ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-base font-semibold text-zinc-900 dark:text-white"
                  >
                    Go to Dashboard
                  </Link>
                  <UserButton />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-3 mt-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 text-center py-2.5 text-sm font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl bg-indigo-600 text-center py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800/80 mt-4 pt-3">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MarketingNavbarFallback() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      // Scroll spy logic for homepage
      if (pathname === "/") {
        const featuresSection = document.getElementById("features");
        if (!featuresSection) {
          setActiveLink("");
          return;
        }

        const rect = featuresSection.getBoundingClientRect();
        const threshold = 160; // offset in px

        if (rect.top <= threshold && rect.bottom >= threshold) {
          setActiveLink("/#features");
        } else {
          setActiveLink("");
        }
      }
    };

    // Set active link for other paths
    if (pathname !== "/") {
      if (pathname.startsWith("/pricing")) {
        setActiveLink("/pricing");
      } else if (pathname.startsWith("/blog")) {
        setActiveLink("/blog");
      } else if (pathname.startsWith("/docs")) {
        setActiveLink("/docs");
      } else {
        setActiveLink("");
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // run once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 py-3">
      <div
        className={cn(
          "mx-auto transition-all duration-300 px-4 sm:px-6 lg:px-8",
          scrolled
            ? "max-w-5xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] py-1"
            : "max-w-7xl bg-transparent border border-transparent py-1.5"
        )}
      >
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-extrabold text-zinc-900 dark:text-white text-lg tracking-tight hover:opacity-90 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span>{APP_NAME}</span>
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = activeLink === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "relative text-sm font-semibold transition-colors px-4 py-2 rounded-xl",
                    isActive ? "text-zinc-900 dark:text-white" : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavHighlightFallback"
                      className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl -z-10 shadow-[0_0_12px_rgba(99,102,241,0.12)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg overflow-hidden mx-auto mt-2 max-w-[calc(100%-2rem)] rounded-2xl shadow-xl"
          >
            <div className="space-y-1.5 px-4 pb-6 pt-3">
              {navLinks.map((link) => {
                const isActive = activeLink === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-base font-semibold transition-colors",
                      isActive
                        ? "bg-indigo-650/10 border border-indigo-500/20 text-indigo-600 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white border border-transparent"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 my-4" />

              <div className="grid grid-cols-2 gap-3 px-3 mt-2">
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 text-center py-2.5 text-sm font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-indigo-600 text-center py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
                >
                  Get Started
                </Link>
              </div>

              <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800/80 mt-4 pt-3">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default MarketingNavbar;
