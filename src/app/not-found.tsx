import { Search, ArrowLeft, LayoutDashboard, BookOpen, CreditCard, Zap } from "lucide-react";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Page Not Found | SaaS Boilerplate Pro",
  description: "The page you were looking for doesn't exist.",
  noIndex: true,
});

const quickLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Your workspace overview" },
  { href: "/blog", label: "Blog", icon: BookOpen, desc: "Articles and updates" },
  { href: "/pricing", label: "Pricing", icon: CreditCard, desc: "View our plans" },
  { href: "/ai", label: "AI Tools", icon: Zap, desc: "AI-powered features" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-10">
        {/* 404 heading */}
        <div className="text-center space-y-3">
          <p className="text-7xl font-black bg-gradient-to-b from-zinc-400 to-zinc-700 bg-clip-text text-transparent leading-none">
            404
          </p>
          <h1 className="text-2xl font-bold text-white">Page not found</h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <form action="/blog" method="get">
            <input
              type="text"
              name="q"
              placeholder="Search articles and docs..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </form>
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
            Quick links
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickLinks.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-zinc-800 group-hover:bg-indigo-500/10 border border-zinc-700 group-hover:border-indigo-500/30 flex items-center justify-center transition-all shrink-0">
                  <Icon className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{label}</p>
                  <p className="text-xs text-zinc-500 truncate">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
