/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { PLANS } from "@/lib/clientPlans";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

/**
 * UpgradeModal is a premium animated modal shown when a user reaches plan limits.
 * Prompts options to upgrade to the Pro plan subscription tier.
 */
export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: PLANS.PRO.priceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 md:p-8 z-10 text-white"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Glowing Accent */}
            <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Upgrade to Pro</h3>
                <p className="text-xs text-zinc-400">Unlock maximum output limits and tools.</p>
              </div>
            </div>

            {/* Alert message if they hit a specific feature limit */}
            {featureName && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
                You've reached the maximum limit for <strong>{featureName}</strong> on the Free tier. Upgrade to Pro to continue.
              </div>
            )}

            {/* Comparison Details */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-800 text-xs text-zinc-500 font-semibold tracking-wider uppercase">
                <div>Free Tier</div>
                <div className="text-indigo-400">Pro Tier ($29/mo)</div>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-zinc-400">50 AI Credits</div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="h-4 w-4 text-indigo-400" />
                    1,000 AI Credits
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-zinc-400">1 Seat</div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="h-4 w-4 text-indigo-400" />
                    5 Seats
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-zinc-400">1GB Storage</div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="h-4 w-4 text-indigo-400" />
                    10GB Storage
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-zinc-400">Basic AI Models</div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="h-4 w-4 text-indigo-400" />
                    Gemini 1.5 Pro
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating checkout...
                  </>
                ) : (
                  "Upgrade to Pro Now"
                )}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition-colors py-3.5 text-center text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer disabled:opacity-50"
              >
                Maybe later
              </button>
            </div>

            <p className="mt-4 text-center text-xxs text-zinc-500 leading-relaxed">
              Includes a 14-day free trial. Cancel anytime in your subscription settings.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default UpgradeModal;
