# Deployment Guide

This project is optimized for Edge deployment on **Vercel** with a Serverless PostgreSQL database.

## 1. Prepare Your Third-Party Accounts

Before deploying, ensure you have production-ready instances of the following:

- **Database**: [Neon](https://neon.tech/) or [Supabase](https://supabase.com/). You need the Connection Pooler URL (`DATABASE_URL`) and the Direct URL (`DIRECT_URL`).
- **Clerk**: Create a production instance. Get the Live Publishable Key and Secret Key.
- **Stripe**: Ensure your account is fully activated. Get your Live keys and create Live Products/Prices.
- **Upstash Redis**: Create a regional database near your Vercel deployment region (e.g., `us-east-1`).
- **Resend**: Verify your custom domain to allow sending emails from `@yourdomain.com`.
- **UploadThing**: Create an App and get the Live keys.

## 2. Deploying to Vercel

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section.
5. Copy the contents of your `.env.local` (ensure you are using LIVE keys, not test keys).
6. Paste the block into Vercel's first Environment Variable key input—Vercel will automatically parse and add them all.
7. Click **Deploy**.

## 3. Database Migration on Production

Once deployed, you need to sync your schema to the production database:

1. Open a terminal on your local machine.
2. Run Prisma push targeting your production database. Note: It is safest to do this locally using the live `DIRECT_URL`.
   ```bash
   DATABASE_URL="your-live-pooler-url" DIRECT_URL="your-live-direct-url" npx prisma db push
   ```
3. Alternatively, if you use migrations, run `npx prisma migrate deploy`.

## 4. Setup Production Webhooks

You must tell Clerk and Stripe where to send webhooks on your live domain.

### Stripe
1. Go to Stripe Dashboard -> Developers -> Webhooks.
2. Add Endpoint: `https://yourdomain.com/api/webhooks/stripe`.
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the *Signing Secret* and add it as `STRIPE_WEBHOOK_SECRET` in Vercel.

### Clerk
1. Go to Clerk Dashboard -> Webhooks.
2. Add Endpoint: `https://yourdomain.com/api/webhooks/clerk`.
3. Select events: `user.created`, `user.updated`, `user.deleted`.
4. Copy the *Signing Secret* and add it as `CLERK_WEBHOOK_SECRET` in Vercel.

## 5. Custom Domain Setup

1. In Vercel, go to your Project -> Settings -> Domains.
2. Enter your custom domain (e.g., `myapp.com`).
3. Follow the instructions to add the A Record or CNAME to your DNS provider (e.g., Cloudflare, Namecheap).
4. Vercel will automatically provision an SSL certificate.

## 6. Vercel Cron Jobs

The boilerplate includes a `vercel.json` file defining cron jobs. Vercel will automatically detect and schedule these. 
**Important Security Step**: To secure your cron endpoints, ensure `CRON_SECRET` is set in your Vercel environment variables. Next.js will verify this secret via the `Authorization: Bearer` header on incoming cron requests.
