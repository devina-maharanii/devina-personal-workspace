"use client";

import { useReportWebVitals } from "next/web-vitals";
import { usePostHog } from "posthog-js/react";

/**
 * Monitors and reports Core Web Vitals to PostHog for real-time performance tracking.
 * 
 * Captures:
 * - TTFB (Time to First Byte)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - INP (Interaction to Next Paint)
 */
export function usePerformance() {
  const posthog = usePostHog();

  useReportWebVitals((metric) => {
    // Only fire if PostHog has initialized
    if (!posthog) return;

    // Send generic performance event
    posthog.capture("core_web_vitals", {
      metric_name: metric.name,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
      id: metric.id, // unique id for the current page load
      navigationType: metric.navigationType, // 'navigate', 'reload', 'back-forward', etc.
    });

    // We can also send dedicated events for critical metrics (LCP/CLS/INP)
    // if we want to build specific funnels or alerts on them.
    if (["LCP", "CLS", "INP"].includes(metric.name)) {
      if (metric.rating === "poor") {
        posthog.capture(`poor_${metric.name.toLowerCase()}`, {
          value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
          id: metric.id,
        });
      }
    }
  });
}
