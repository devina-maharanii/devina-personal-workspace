import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, LayoutGrid, Rocket, ShieldCheck } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Documentation Hub",
  description: "Practical guides for architecture, customization, deployment, accessibility, and shipping features.",
});

const docs = [
  {
    id: "architecture",
    title: "System Architecture",
    description:
      "Understand how the App Router, Clerk, Stripe, Prisma, Redis, and AI services fit together.",
    icon: LayoutGrid,
    highlights: ["Request flow", "Data model", "Real-time updates"],
  },
  {
    id: "customization",
    title: "Customization",
    description:
      "Adapt branding, layout, and product behavior without breaking the core SaaS foundation.",
    icon: ShieldCheck,
    highlights: ["Branding", "UI tokens", "Feature toggles"],
  },
  {
    id: "adding-features",
    title: "Adding Features",
    description:
      "A focused path for shipping new routes, components, APIs, and schema changes safely.",
    icon: Rocket,
    highlights: ["Routing", "Database changes", "Testing"],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    description:
      "Keep keyboard navigation, contrast, semantics, and motion comfortable across the product.",
    icon: CheckCircle2,
    highlights: ["Keyboard flow", "Contrast", "Reduced motion"],
  },
  {
    id: "deployment",
    title: "Deployment",
    description:
      "Prepare local env vars, production secrets, and Vercel releases with less guesswork.",
    icon: BookOpen,
    highlights: ["Environment setup", "Release checks", "Rollback safety"],
  },
];

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-zinc-800/80 bg-zinc-950/90 px-6 py-10 shadow-2xl shadow-black/30 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_30%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            <BookOpen className="h-3.5 w-3.5 text-sky-400" />
            Documentation Hub
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Everything you need to ship, customize, and scale.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            These guides explain the architecture, deployment flow, accessibility standards, and the recommended path for adding new product features.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#features"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Explore features
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {docs.map((doc) => {
          const Icon = doc.icon;

          return (
            <article
              key={doc.id}
              id={doc.id}
              className="group rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500">
                  Guide
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">{doc.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{doc.description}</p>

              <ul className="mt-5 space-y-2 text-sm text-zinc-300">
                {doc.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <a
                href={`#${doc.id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 transition group-hover:text-sky-300"
              >
                Jump to section
                <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          );
        })}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Recommended reading order</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {docs.map((doc, index) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Step {index + 1}
                </div>
                <div className="mt-2 text-base font-semibold text-white">{doc.title}</div>
                <div className="mt-1 text-sm leading-6 text-zinc-400">{doc.description}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-sky-500/10 via-zinc-950 to-emerald-500/10 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Quick start
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Build with fewer unknowns.</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Use the architecture and deployment guides first, then move into customization and feature work.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Read the blog
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Start free trial
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}