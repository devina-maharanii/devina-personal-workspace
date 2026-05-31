import { useEffect } from "react";
import { useSubscriptionStore } from "@/stores/subscriptionStore";

/**
 * Client-side react hook querying the Zustand store for subscription details.
 * Hydrates state if not loaded and checks features.
 */
export function useSubscription() {
  const {
    plan,
    status,
    isActive,
    isPro,
    isEnterprise,
    limits,
    isLoading,
    fetchSubscription,
  } = useSubscriptionStore();

  useEffect(() => {
    // Hydrate store on load
    fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Helper checking if a feature usage value is within the plan constraints.
   * Returns true if usage is under the limit, false if it is exceeded.
   */
  const checkLimit = (feature: keyof typeof limits, currentUsage: number): boolean => {
    const limitVal = limits[feature];
    if (typeof limitVal === "number") {
      return currentUsage < limitVal;
    }
    if (typeof limitVal === "string") {
      // e.g. "10GB" or "1GB". Parse to number of GB.
      const limitNum = parseInt(limitVal, 10);
      return currentUsage < limitNum;
    }
    return true;
  };

  return {
    plan,
    status,
    isActive,
    isPro,
    isEnterprise,
    limits,
    isLoading,
    checkLimit,
  };
}

export default useSubscription;
