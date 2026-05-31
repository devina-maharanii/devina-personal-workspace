import { create } from "zustand";
import { PLANS, getPlanByPriceId } from "@/lib/clientPlans";
import { SubscriptionStatus } from "@prisma/client";

export interface SubscriptionState {
  plan: typeof PLANS.FREE | typeof PLANS.PRO | typeof PLANS.ENTERPRISE;
  status: SubscriptionStatus | "FREE";
  isActive: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  limits: {
    aiCredits: number;
    members: number;
    storage: string;
  };
  isLoading: boolean;
  error: string | null;
  setSubscription: (data: { status: SubscriptionStatus | null; stripePriceId: string | null }) => void;
  fetchSubscription: () => Promise<void>;
}

/**
 * Zustand store that manages subscription state on the client side.
 * Automatically synchronizes with /api/user/me endpoints.
 */
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: PLANS.FREE,
  status: "FREE",
  isActive: false,
  isPro: false,
  isEnterprise: false,
  limits: PLANS.FREE.limits,
  isLoading: true,
  error: null,
  setSubscription: (data) => {
    const status = data.status || "FREE";
    const isActive = status === "ACTIVE" || status === "TRIALING";
    const priceId = data.stripePriceId || "";
    
    let plan: SubscriptionState["plan"] = PLANS.FREE;
    if (isActive) {
      plan = getPlanByPriceId(priceId);
    }
    
    set({
      plan,
      status,
      isActive,
      isPro: plan.id === "pro",
      isEnterprise: plan.id === "enterprise",
      limits: plan.limits,
      isLoading: false,
    });
  },
  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/user/me");
      if (!res.ok) throw new Error("Failed to fetch subscription profile");
      const { user } = await res.json();
      
      if (!user) {
        set({
          plan: PLANS.FREE,
          status: "FREE",
          isActive: false,
          isPro: false,
          isEnterprise: false,
          limits: PLANS.FREE.limits,
          isLoading: false,
        });
        return;
      }

      const sub = user.subscription;
      const status = sub?.status || "FREE";
      const isActive = status === "ACTIVE" || status === "TRIALING";
      const priceId = sub?.stripePriceId || "";
      
      let plan: SubscriptionState["plan"] = PLANS.FREE;
      if (isActive) {
        plan = getPlanByPriceId(priceId);
      }

      set({
        plan,
        status,
        isActive,
        isPro: plan.id === "pro",
        isEnterprise: plan.id === "enterprise",
        limits: plan.limits,
        isLoading: false,
      });
     
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load subscription status";
      set({
        plan: PLANS.FREE,
        status: "FREE",
        isActive: false,
        isPro: false,
        isEnterprise: false,
        limits: PLANS.FREE.limits,
        isLoading: false,
        error: message,
      });
    }
  },
}));
