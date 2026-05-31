# 🚀 Devina Maharani — Personal AI Workspace & SaaS Platform

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6--canary-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Database](https://img.shields.io/badge/Prisma-PostgreSQL-2196F3?style=flat-square&logo=prisma)](https://prisma.io)

This repository hosts the **Personal AI Workspace & SaaS Platform of Devina Maharani**. Built on the bleeding edge of the web ecosystem (Next.js 16, React 19, Tailwind CSS v4, and Turbopack), it is a high-performance, production-ready system featuring secure authentication, personal AI tools (Streaming Chat, Multimodal Vision, and Text Summarization), file storage, edge rate limiting, and an admin dashboard.

---

## 🛠️ The Tech Stack & Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Powered by Turbopack and React 19 for rapid builds and smooth page transitions. |
| **Styling** | Tailwind CSS v4 | Curated glassmorphism themes with native Light & Dark mode support. |
| **Animations** | Framer Motion | Fluid scroll effects, micro-animations, and animated circular progress-to-top indicator. |
| **Auth** | Clerk Authentication | Organizations system, workspace scoping, and secure invite-link flows. |
| **Billing** | Stripe Billing | Subscriptions Checkout, Stripe Promo codes, Customer Billing Portal, and webhook handlers. |
| **Database** | Prisma / PostgreSQL | High-performance schemas, type-safe DB client, and auto-syncing schema migrations. |
| **AI Integration**| Gemini API (Google AI) | Streaming AI Chat, Multimodal AI Vision, AI Summarization, and custom System Prompts. |
| **File Storage** | UploadThing | Secure, lightning-fast file upload system for avatars and dashboard files. |
| **Rate Limiting** | Upstash Redis | Edge rate-limiting middleware to protect serverless APIs from spam. |
| **Monitoring** | Sentry SDK | Edge, Server, and Client-side error tracking and crash reporting logs. |

---

## ✨ Core SaaS Capabilities

### 1. Complete AI Workspace
*   **AI Streaming Chat:** Fluid message rendering with markdown syntax highlighting and code parsing using `@tiptap/react` and `highlight.js`.
*   **AI Vision Dashboard:** Upload images via UploadThing and analyze them instantly using Gemini Multimodal APIs.
*   **AI Summarizer:** Extract summaries, bullet points, or action items from lengthy blocks of text.
*   **System Prompts Engine:** Save, edit, and select customized prompts to shape the AI's behavior across your workspace.

### 2. Multi-Tenant Organization Structure
*   Workspace isolation out of the box using **Clerk Organizations**.
*   Generate team invite links and invite members to share AI usage quota.
*   Dynamic custom domain rewriting (e.g., rewriting `tenant.yourdomain.com` or custom domains straight to workspace routes).

### 3. Stripe Billing & Subscription Management
*   Monthly & Yearly billing cycles pre-aligned to free, pro, and enterprise tiers.
*   Secure self-service customer portal where users can manage, upgrade, or cancel their plans.
*   Automated live Stripe webhook verification and syncing databases.

### 4. Admin Management Dashboard
*   Administrative overview of active subscriptions, total registered users, and active database objects.
*   Detailed **System Audit Logs** capturing admin actions to prevent operational errors.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/                      # Next.js App Router folders & page routes
│   │   ├── (admin)/              # Super-Admin console & Audit Log dashboards
│   │   ├── (auth)/               # Clerk Login, Sign-up, and Mock Auth bypass
│   │   ├── (dashboard)/          # User Workspace pages (Analytics, Files)
│   │   ├── (marketing)/          # Landing Page, Pricing, Terms, & Privacy policies
│   │   ├── api/                  # Backend Serverless routes (Stripe, Clerk, AI)
│   │   └── onboarding/           # Workspace creation & onboarding flows
│   ├── components/               # Modular UI components separated by categories
│   │   ├── admin/                # Administrative dashboard cards
│   │   ├── marketing/            # Landing page sections & Pricing grids
│   │   └── shared/               # Circular scroll-to-top button, theme toggle, providers
│   ├── lib/                      # Stripe, Redis, Resend, and Gemini SDK configurations
│   ├── hooks/                    # Reusable React hooks (theme detection, mock status)
│   ├── stores/                   # State management handlers (Zustand)
│   └── proxy.ts                  # Next.js 16 Edge proxy & route protection middleware
├── prisma/                       # Database schema and seed scripts
├── scripts/                      # OpenGraph (OG) image generation automation
├── vercel.json                   # Deployment configurations, cron schedules, & functions
├── eslint.config.mjs             # Optimised ESLint code guidelines
└── package.json                  # Dependencies & package scripts
```

---

## 🚀 Local Setup & Development

### 1. Prerequisites
Ensure you have **Node.js 20+** and a running **PostgreSQL** instance.

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/your-saas-repo.git
cd your-saas-repo
npm install
```

### 3. Environment Setup
Copy the example environment files and populate them with your API credentials:
```bash
cp .env.example .env
cp .env.local.example .env.local
```
> [!IMPORTANT]
> Make sure to configure your database pool URLs (`DATABASE_URL`), Clerk credentials, Stripe price IDs, Gemini API Key, UploadThing token, and Upstash Redis URL.

### 4. Sync Database Schemas
Apply database migrations and populate default pricing tiers:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your local instance.

---

## 🧪 Testing Guidelines

This codebase features automated test suites for continuous integration.

*   **Unit & Integration Tests (Vitest):**
    ```bash
    npm run test
    ```
*   **End-to-End Tests (Playwright):**
    ```bash
    npx playwright install
    npm run test:e2e
    ```

---

## 📦 Deployment to Vercel

1.  Connect your Git repository to **Vercel**.
2.  Import all variables from `.env.local` and `.env` into Vercel Settings -> Environment Variables.
3.  Set the Build Command to `npm run build` and Directory to `.`.
4.  Add your Production URL as an authorized domain in **Clerk** and **Stripe** consoles.
5.  Set up Vercel Crons to point to `/api/cron/*` endpoints as configured in `vercel.json` (runs subscription validations, webhook retry buffers, etc.).

---

## 📄 License
This project is licensed under the MIT License. You have complete rights to customize, white-label, rebrand, and sell this application.
