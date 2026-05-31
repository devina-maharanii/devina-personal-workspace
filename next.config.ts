import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project (read from env at build time)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress Sentry CLI output during builds
  silent: !process.env.CI,

  // Upload source maps to Sentry for readable stack traces in production
  widenClientFileUpload: true,

  // Tree-shaking options to reduce Sentry SDK bundle size
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // Hides source maps from the client bundle (security best practice)
  sourcemaps: {
    disable: false,
    deleteSourcemapsAfterUpload: true,
  },
});
