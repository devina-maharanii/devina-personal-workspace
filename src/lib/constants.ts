import { env } from "./env";

// ─── Application Configuration ────────────────────────────────────────────────
export const APP_NAME = env.NEXT_PUBLIC_APP_NAME || "Devina Maharani";
export const APP_URL = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const SUPPORT_EMAIL = "support@devinamaharani.com";

export const SITE_CONFIG = {
  name: APP_NAME,
  description: "Devina Maharani's Personal AI Workspace & SaaS Platform, powered by Next.js, Stripe, Clerk, and Gemini AI.",
  url: APP_URL,
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com/devinamaharani",
    github: "https://github.com/devinamaharani",
  },
};

// ─── Plan Limits (Aligned with stripe.ts Tiers) ────────────────────────────────
import { PLANS as PLANS_NEW, PLAN_LIMITS as PLAN_LIMITS_NEW } from "./clientPlans";
export const PLAN_LIMITS = PLAN_LIMITS_NEW;
export const PLANS = [PLANS_NEW.FREE, PLANS_NEW.PRO, PLANS_NEW.ENTERPRISE];

// ─── Subscription Statuses ───────────────────────────────────────────────────
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
} as const;

// ─── Notification Types ───────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  SYSTEM: "system",
  BILLING: "billing",
  SECURITY: "security",
  CREDITS: "credits",
  TEAM: "team",
  ALERT: "alert",
} as const;

// ─── File Size Limits (UploadThing Boundaries) ────────────────────────────────
export const FILE_SIZE_LIMITS = {
  IMAGE: 4 * 1024 * 1024, // 4MB
  DOCUMENT: 8 * 1024 * 1024, // 8MB
  VIDEO: 32 * 1024 * 1024, // 32MB
  AVATAR: 2 * 1024 * 1024, // 2MB
} as const;

// ─── PostHog Analytics Events ────────────────────────────────────────────────
export const ANALYTICS_EVENTS = {
  USER_SIGNED_UP: "user_signed_up",
  USER_SIGNED_IN: "user_signed_in",
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  AI_CHAT_MESSAGE_SENT: "ai_chat_message_sent",
  AI_DOCUMENT_SUMMARIZED: "ai_document_summarized",
  AI_CONTENT_GENERATED: "ai_content_generated",
  AI_CREDITS_EXHAUSTED: "ai_credits_exhausted",
  AI_CREDITS_CONSUMED: "ai_credits_consumed",
  UPGRADE_MODAL_OPENED: "upgrade_modal_opened",
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  MEMBER_INVITED: "member_invited",
  MEMBER_JOINED: "member_joined",
  BLOG_POST_CREATED: "blog_post_created",
  BLOG_POST_PUBLISHED: "blog_post_published",
  FILE_UPLOADED: "file_uploaded",
} as const;
