import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import Stripe from "stripe";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed script...");

  // 1. Seed Default Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@saasplatform.com";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      clerkId: `admin_${Math.random().toString(36).substring(2, 10)}`,
      name: "System Admin",
      role: "ADMIN",
    },
  });
  console.log(`Admin user seeded: ${adminUser.email} (ID: ${adminUser.id})`);

  // 2. Seed Sample Organization
  const sampleOrg = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      plan: "FREE",
    },
  });
  console.log(`Sample organization seeded: ${sampleOrg.name} (Slug: ${sampleOrg.slug})`);

  // 3. Seed Membership to Org (Admin is OWNER)
  const membership = await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: sampleOrg.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      userId: adminUser.id,
      organizationId: sampleOrg.id,
      role: "OWNER",
    },
  });
  console.log(`Admin user bound to organization as OWNER (Membership ID: ${membership.id})`);

  // 4. Seed 3 published blog posts
  const posts = [
    {
      title: "Supercharging SaaS Development with Antigravity",
      slug: "supercharging-saas-antigravity",
      excerpt: "Learn how modern next-gen AI boilerplates streamline SaaS development, routing, and deployment processes.",
      content: "<h1>Supercharging SaaS Development with Antigravity</h1><p>Building SaaS platforms historically took months of plumbing together authentication, stripe billing, databases, and cron endpoints. With Antigravity's premium AI-centric SaaS boilerplate, you have a production-grade infrastructure standing in minutes. Leveraging next-generation React features, absolute typings, and strict security posture, developers can build without friction.</p>",
    },
    {
      title: "Implementing Robust Security Posture in Next.js",
      slug: "securing-nextjs-applications",
      excerpt: "A deep dive into advanced Content Security Policies, HSTS, and request validation techniques in modern web apps.",
      content: "<h1>Implementing Robust Security Posture in Next.js</h1><p>Security is not an afterthought; it is a foundational component of modern software engineering. By declaring strict HTTP header directives (such as frame-ancestors, upgrade-insecure-requests, and script-src nonces), Next.js applications mitigate standard vectors like Cross-Site Scripting (XSS) and Clickjacking. Learn how to configure modern headers in next.config.ts seamlessly.</p>",
    },
    {
      title: "Optimizing AI Tokens Footprint & Spends",
      slug: "optimizing-ai-tokens-spends",
      excerpt: "Strategies for reducing context size, caching tokens, and configuring analytics dashboards to optimize model usage.",
      content: "<h1>Optimizing AI Tokens Footprint & Spends</h1><p>As LLM integrations scale, handling token density and billing overhead becomes crucial. Utilizing key templates inside Upstash Redis for semantic caches, limiting prompt length constraints, and utilizing high-efficiency model configurations can cut your input spends by up to 35%. Integrate PostHog events to track real-time cost analysis.</p>",
    },
  ];

  for (const post of posts) {
    const seededPost = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        published: true,
        publishedAt: new Date(),
        authorId: adminUser.id,
        organizationId: sampleOrg.id,
      },
    });
    console.log(`Blog post seeded: ${seededPost.title} (Slug: ${seededPost.slug})`);
  }

  // 5. Seed Stripe Products/Prices using Stripe SDK if API Key is configured
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    try {
      const stripe = new Stripe(stripeKey, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiVersion: "2026-04-22.dahlia" as any,
      });

      console.log("Checking Stripe products and prices...");

      // List existing products to avoid duplication
      const existingProducts = await stripe.products.list({ limit: 100 });
      
      const proProductExists = existingProducts.data.some(p => p.name === "Pro Monthly Plan" || p.metadata.plan_key === "pro");
      const entProductExists = existingProducts.data.some(p => p.name === "Enterprise Monthly Plan" || p.metadata.plan_key === "enterprise");

      if (!proProductExists) {
        console.log("Creating Pro Monthly product and prices...");
        const proProduct = await stripe.products.create({
          name: "Pro Monthly Plan",
          description: "For professionals needing unlimited scale.",
          metadata: { plan_key: "pro" },
        });

        const proPrice = await stripe.prices.create({
          product: proProduct.id,
          unit_amount: 2900,
          currency: "usd",
          recurring: { interval: "month" },
        });
        console.log(`Created Pro Monthly Plan. Price ID: ${proPrice.id}`);

        const proAnnualPrice = await stripe.prices.create({
          product: proProduct.id,
          unit_amount: 29000,
          currency: "usd",
          recurring: { interval: "year" },
        });
        console.log(`Created Pro Annual Plan. Price ID: ${proAnnualPrice.id}`);
      } else {
        console.log("Pro Plan products already exist in Stripe dashboard. Skipping creation.");
      }

      if (!entProductExists) {
        console.log("Creating Enterprise product and prices...");
        const enterpriseProduct = await stripe.products.create({
          name: "Enterprise Monthly Plan",
          description: "Custom solutions for large scale organizations.",
          metadata: { plan_key: "enterprise" },
        });

        const enterprisePrice = await stripe.prices.create({
          product: enterpriseProduct.id,
          unit_amount: 9900,
          currency: "usd",
          recurring: { interval: "month" },
        });
        console.log(`Created Enterprise Monthly Plan. Price ID: ${enterprisePrice.id}`);

        const enterpriseAnnualPrice = await stripe.prices.create({
          product: enterpriseProduct.id,
          unit_amount: 99000,
          currency: "usd",
          recurring: { interval: "year" },
        });
        console.log(`Created Enterprise Annual Plan. Price ID: ${enterpriseAnnualPrice.id}`);
      } else {
        console.log("Enterprise Plan products already exist in Stripe dashboard. Skipping creation.");
      }

      console.log("Stripe products seeded successfully!");
     
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn("Stripe seeding warning: Could not seed Stripe products/prices. Ensure your STRIPE_SECRET_KEY is valid. Error:", message);
    }
  } else {
    console.log("Skipping Stripe seeding: STRIPE_SECRET_KEY environment variable not configured.");
  }

  console.log("Database seed script completed successfully!");
}

main()
  .catch((e) => {
    console.error("Database seeding encountered a fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
