/* eslint-disable react/no-unescaped-entities */
"use client";

import { SignIn } from "@/lib/clerk-client";
import { motion } from "framer-motion";
import { Sparkles, Quote } from "lucide-react";
import { useIsMockAuth } from "@/hooks/useIsMockAuth";
import { signInMockUser } from "@/lib/actions/mock-auth";

/**
 * SignInPage renders a responsive split-screen sign-in page.
 * Left Side: Testimonial & product value propositions (visible on lg screens).
 * Right Side: Styled Clerk SignIn form with motion entry animations.
 */
export default function SignInPage() {
  const isMock = useIsMockAuth();

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-950 text-white font-sans">
      {/* Left side: Brand Showcase (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950/40 relative overflow-hidden border-r border-zinc-800/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--color-indigo-950)_0%,_transparent_50%)] opacity-40 pointer-events-none" />
        
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2.5 z-10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Antigravity AI
          </span>
        </motion.div>

        {/* Tagline & Testimonial Quote */}
        <div className="space-y-12 z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight lg:text-5xl">
              Accelerate your workflow with <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">next-gen intelligence</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md">
              Deploy SaaS boilerplate features, authentication, stripe subscriptions, and custom analytics dashboards in minutes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-md space-y-4 relative max-w-lg"
          >
            <Quote className="absolute top-4 right-6 h-12 w-12 text-zinc-800/40 pointer-events-none" />
            <p className="text-zinc-300 italic text-base leading-relaxed relative z-10">
              "Integrating this boilerplate into our product pipeline saved us months of engineering. The Clerk integration and Stripe webhooks worked flawlessly out-of-the-box."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm border border-zinc-800">
                JD
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Jane Doe</div>
                <div className="text-xs text-zinc-500">CTO, Nexus Dynamics</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-xs text-zinc-600 z-10"
        >
          &copy; {new Date().getFullYear()} Antigravity AI. All rights reserved.
        </motion.div>
      </div>

      {/* Right side: Login form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Glow backdrop on mobile */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-indigo-950)_0%,_transparent_70%)] opacity-30 lg:hidden pointer-events-none" />

        {/* Top Header for mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-8 z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Antigravity AI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10 flex justify-center"
        >
          {isMock ? (
            <div className="w-full shadow-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-8 rounded-2xl flex flex-col space-y-6">
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 justify-center sm:justify-start">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                  Mock Authentication
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The application is running in preview/mock mode. Click below to instantly log in as a mock administrator to explore features, dashboard widgets, and settings.
                </p>
              </div>

              <form action={signInMockUser} className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Sign In with Mock Account
                </button>
              </form>

              <div className="text-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  ✦ preview mode bypasses clerk server scripts
                </span>
              </div>
            </div>
          ) : (
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#6366f1",
                  colorBackground: "#18181b",
                  colorInputBackground: "#09090b",
                  colorInputText: "#ffffff",
                  colorText: "#f4f4f5",
                  colorTextSecondary: "#a1a1aa",
                  colorDanger: "#ef4444",
                  borderRadius: "12px",
                },
                elements: {
                  card: "shadow-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl w-full",
                  headerTitle: "text-2xl font-bold tracking-tight text-white",
                  headerSubtitle: "text-sm text-zinc-400",
                  socialButtonsBlockButton: "bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-200 transition-all font-medium",
                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors",
                  footerActionLink: "text-indigo-400 hover:text-indigo-300",
                  dividerLine: "bg-zinc-800",
                  dividerText: "text-zinc-500",
                  formFieldLabel: "text-zinc-300",
                  formFieldInput: "border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white bg-zinc-950",
                },
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
