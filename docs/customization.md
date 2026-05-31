# Customization Guide

This guide covers how to customize the core branding, pricing, AI models, and feature flags of the boilerplate.

## 1. Changing Colors and Branding

We use Tailwind CSS v4 alongside `shadcn/ui`. All global colors are defined as CSS variables in `src/styles/globals.css`.

To change your primary brand color:
1. Open `src/styles/globals.css`.
2. Locate the `--primary` and `--primary-foreground` variables in both the `:root` (light mode) and `.dark` blocks.
3. Update them to your brand's HSL values.

```css
:root {
  /* Change from default slate/zinc to your brand color, e.g., Blue */
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
}
```

## 2. Modifying Pricing Plans

Pricing structures are centralized to avoid mismatches between the UI and Stripe.

1. Open `src/lib/constants.ts`.
2. Locate the `PRICING_PLANS` constant.

```typescript
export const PRICING_PLANS = [
  {
    id: "pro",
    name: "Pro",
    description: "For professionals and small teams.",
    price: "$29",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ["Unlimited projects", "1,000 AI Credits", "Priority Support"],
  },
];
```
*Note: Make sure `STRIPE_PRO_PRICE_ID` in your `.env.local` matches the exact Price ID generated in your Stripe Dashboard.*

## 3. Abstracting AI Providers

By default, the boilerplate uses the Vercel AI SDK, which allows seamless switching between models (Claude, Gemini, OpenAI).

To switch models globally:
1. Open `src/lib/ai.ts`.
2. Change the provider import.

```typescript
// From Gemini
import { google } from "@ai-sdk/google";
const model = google("gemini-1.5-pro");

// To Anthropic
import { anthropic } from "@ai-sdk/anthropic";
const model = anthropic("claude-3-5-sonnet-20240620");
```

Remember to update your `.env.local` with the respective `ANTHROPIC_API_KEY` or `GOOGLE_GEMINI_API_KEY`.

## 4. Managing Navigation Items

The sidebar and top navigation arrays are located in the respective layout or constant files.
- **Dashboard Sidebar**: Update `src/components/dashboard/Sidebar.tsx` navigation array.
- **Marketing Header**: Update `src/components/shared/Header.tsx`.

## 5. Feature Flags (PostHog)

If you are using PostHog, you can wrap new experimental features in a flag.

```tsx
import { useFeatureFlagEnabled } from 'posthog-js/react'

export function ExperimentalWidget() {
  const isEnabled = useFeatureFlagEnabled('new-experimental-widget')

  if (!isEnabled) return null;

  return <div>New Feature!</div>
}
```
