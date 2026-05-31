"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  /** Plan name displayed as the card heading */
  name: string;
  /** Short marketing description shown under the name */
  description: string;
  /** Monthly price in USD (0 for free tier) */
  price: number;
  /** Feature bullet list */
  features: readonly string[];
  /** When true the card shows the "Most Popular" ribbon and indigo border */
  featured?: boolean;
  /** CTA button label */
  ctaLabel: string;
  /** CTA href — if provided renders a <Link>; otherwise a <button> calling onCtaClick */
  ctaHref?: string;
  /** Called when the CTA button is clicked (ignored if ctaHref is set) */
  onCtaClick?: () => void;
  /** Disables the CTA while an async action is in progress */
  isLoading?: boolean;
  /** Extra class names for the wrapper */
  className?: string;
}

/**
 * Pure, testable pricing plan card.
 * Extracted from PricingClient.tsx so that unit tests do not depend on
 * Clerk / Framer Motion / Zustand stores.
 *
 * Usage in PricingClient:
 * ```tsx
 * <PricingCard
 *   name={PLANS.PRO.name}
 *   description={PLANS.PRO.description}
 *   price={PLANS.PRO.price}
 *   features={PLANS.PRO.features}
 *   featured
 *   ctaLabel="Upgrade to Pro"
 *   onCtaClick={() => handleCheckout(PLANS.PRO.priceId, "Pro")}
 *   isLoading={loadingAction !== null}
 * />
 * ```
 */
export default function PricingCard({
  name,
  description,
  price,
  features,
  featured = false,
  ctaLabel,
  ctaHref,
  onCtaClick,
  isLoading = false,
  className,
}: PricingCardProps) {
  return (
    <div
      data-testid="pricing-card"
      className={cn(
        "relative flex flex-col justify-between rounded-3xl p-8 border backdrop-blur-sm transition-colors duration-300",
        featured
          ? "border-indigo-500/50 bg-card/75 dark:bg-card/40 shadow-xl shadow-indigo-600/5 ring-1 ring-indigo-500/30"
          : "border-border bg-card/40 dark:bg-card/10",
        className,
      )}
    >
      {featured && (
        <span
          data-testid="featured-ribbon"
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 border border-indigo-500/50 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
        >
          Most Popular
        </span>
      )}

      {/* Plan info */}
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground" data-testid="plan-name">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <div className="flex items-baseline gap-1 text-foreground">
          <span className="text-4xl font-extrabold tracking-tight" data-testid="plan-price">
            ${price}
          </span>
          <span className="text-xs font-bold text-muted-foreground">/month</span>
        </div>

        <ul className="space-y-3 text-xs text-foreground/80" data-testid="feature-list">
          {features.map((feat, i) => (
            <li key={i} className="flex gap-2.5 items-center">
              <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="pt-8">
        {ctaHref ? (
          <Link
            href={ctaHref}
            data-testid="cta-button"
            className={cn(
              "block w-full py-3 rounded-xl text-center text-xs font-bold transition-all active:scale-95",
              featured
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 dark:shadow-none"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
            )}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            data-testid="cta-button"
            onClick={onCtaClick}
            disabled={isLoading}
            className={cn(
              "w-full py-3 rounded-xl text-center text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2",
              featured
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 dark:shadow-none"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
              isLoading && "opacity-60 cursor-not-allowed",
            )}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
