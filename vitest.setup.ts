process.env.SKIP_ENV_VALIDATION = "true";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.CLERK_SECRET_KEY = "clerk_mock";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_mock";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_mock";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://localhost:5432/mock";
process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "mock_token";
process.env.UPLOADTHING_SECRET = "sk_live_mock";
process.env.UPLOADTHING_APP_ID = "mock_app";
process.env.RESEND_API_KEY = "re_mock";
process.env.GEMINI_API_KEY = "gemini_mock";
process.env.WEBHOOK_SECRET = "wh_mock";
process.env.NEXT_PUBLIC_POSTHOG_KEY = "ph_mock";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://app.posthog.com";

import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("stripe", () => {
  return {
    default: class {
      constructor() {}
    },
  };
});


