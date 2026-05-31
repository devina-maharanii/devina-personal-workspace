import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CopyButton from "./CopyButton";
import { constructMetadata } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/constants";
import DOMPurify from "isomorphic-dompurify";
import { BlogAvatar, BlogCover } from "@/components/shared/BlogMedia";


// Avoid build-time DB access (e.g. during `next build` page-data collection).
export const dynamic = "force-dynamic";

// Next.js dynamic metadata generator
export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;

  try {
    const post = await db.blogPost.findUnique({
      where: { slug: params.slug },
    });

    if (!post) {
      return { title: "Post Not Found" };
    }

    const seoTitle = post.seoTitle || post.title;
    const seoDesc = post.seoDescription || post.excerpt || "Read full design logs from our engineering workspace.";
    const canonicalUrl = `${SITE_CONFIG.url}/blog/${post.slug}`;
    const ogImage = post.coverImage || `${SITE_CONFIG.url}/og/${post.slug}.svg`;

    return constructMetadata({
      title: seoTitle,
      description: seoDesc,
      image: ogImage,
      canonical: canonicalUrl,
    });
  } catch {
    // Fail-safe: never hard-fail the route due to DB availability.
    return constructMetadata({
      title: "Blog Post",
      description: "Read the latest guides, software updates, and tutorials.",
      canonical: `${SITE_CONFIG.url}/blog/${params.slug}`,
    });
  }
}

interface HeadingItem {
  text: string;
  id: string;
  level: number;
}

// Dynamic TOC headings extraction helper
function extractHeadings(content: string): HeadingItem[] {
  const headingRegex = /<h([2-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings: HeadingItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1], 10);
    const rawText = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
    const id = rawText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    headings.push({ text: rawText, id, level });
  }

  return headings;
}

import JsonLd from "@/components/shared/JsonLd";

// Injects heading IDs into HTML source to enable TOC anchors
function injectHeadingIds(content: string): string {
  return content.replace(/<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, text) => {
    if (attrs.includes("id=")) return match;
    const rawText = text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const id = rawText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `<h${level} id="${id}" ${attrs}>${text}</h${level}>`;
  });
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  
  // 1. Fetch Post Detail
  const post = await db.blogPost.findUnique({
    where: { slug: params.slug },
    include: {
      author: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!post || !post.published) {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const processedContent = injectHeadingIds(post.content);

  // Estimator for reading duration
  const wpm = 225;
  const words = post.content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(words / wpm));

  // 2. Fetch Related Posts (sharing tags, or latest fallback)
  let related = await db.blogPost.findMany({
    where: {
      published: true,
      slug: { not: post.slug },
      tags: { hasSome: post.tags },
    },
    take: 3,
    include: {
      author: {
        select: { name: true, avatarUrl: true },
      },
    },
  });

  if (related.length === 0) {
    related = await db.blogPost.findMany({
      where: { published: true, slug: { not: post.slug } },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: {
        author: {
          select: { name: true, avatarUrl: true },
        },
      },
    });
  }

  // Construct absolute URL for sharing
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/blog/${post.slug}`;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.title,
    "image": post.coverImage || `${SITE_CONFIG.url}/og/${post.slug}.svg`,
    "datePublished": post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
    "dateModified": new Date(post.updatedAt).toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author.name || "Staff Writer"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Boilerplate Pro",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_CONFIG.url}/logo.png`
      }
    }
  };

  return (
    <div className="relative isolate overflow-hidden bg-zinc-950 text-white min-h-screen py-24 sm:py-32">
      <JsonLd schema={blogPostingSchema} />
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-indigo-900)_0%,_transparent_60%)] opacity-20 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Back Link */}
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all articles
          </Link>
        </div>

        {/* Article Header */}
        <header className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium">
            {post.tags.map((tag) => (
              <span key={tag} className="text-indigo-400 font-bold uppercase tracking-wider">
                #{tag}
              </span>
            ))}
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.publishedAt ? formatDistanceToNow(new Date(post.publishedAt)) + " ago" : "Draft"}
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed italic border-l-2 border-indigo-500 pl-4">
            {post.excerpt || "Read full deployment parameters and software releases."}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <BlogAvatar
              src={post.author.avatarUrl}
              name={post.author.name}
              sizeClassName="h-9 w-9"
              imageSize={36}
              fallbackClassName="text-[11px]"
            />
            <div>
              <p className="text-xs font-bold text-white">{post.author.name || "Staff Member"}</p>
              <p className="text-[10px] text-zinc-500">Core Developer</p>
            </div>
          </div>
        </header>

        {/* Featured Cover Image */}
        <BlogCover
          src={post.coverImage}
          title={post.title}
          className="max-w-5xl mx-auto aspect-video rounded-3xl border border-zinc-900"
          sizes="(max-w-1024px) 100vw, 1024px"
          priority
        />

        {/* Main content columns */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6 items-start">
          
          {/* Left panel: Table of Contents & Social Share (Sticky) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-8 order-2 lg:order-1">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="space-y-3 bg-zinc-900/20 border border-zinc-900 p-5 rounded-2xl">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  On this page
                </h4>
                <nav className="space-y-2">
                  {headings.map((h, index) => (
                    <a
                      key={index}
                      href={`#${h.id}`}
                      className={`block text-[11px] hover:text-indigo-400 transition-colors text-zinc-500 leading-tight ${
                        h.level === 3 ? "pl-3 border-l border-zinc-900/60" : "font-semibold"
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Social Sharing tools */}
            <div className="space-y-3 bg-zinc-900/20 border border-zinc-900 p-5 rounded-2xl">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Share this article
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Share on Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Share on Facebook"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                  </svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Share on LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <CopyButton text={shareUrl} />
              </div>
            </div>
          </aside>

          {/* Center Column: Article Prose */}
          <article className="lg:col-span-9 order-1 lg:order-2">
            <div 
              className="prose prose-invert max-w-none prose-sm sm:prose-base prose-indigo prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-850 prose-pre:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processedContent) }}
            />

            {/* Author Footer Card */}
            <div className="mt-12 p-6 sm:p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <BlogAvatar
                src={post.author.avatarUrl}
                name={post.author.name}
                sizeClassName="h-16 w-16"
                imageSize={64}
                fallbackClassName="text-sm"
              />
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-white">
                  Written by {post.author.name || "Staff Member"}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  A software engineer focused on scaling high-performance web systems and integrating artificial intelligence workflows securely.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Core Developer
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Bottom Panel: Related Posts */}
        <footer className="pt-16 border-t border-zinc-900/60 max-w-6xl mx-auto space-y-8">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Related Articles</h3>
            <p className="text-xs text-zinc-500">Other publications you might be interested in reading.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((rp) => {
              const rpReadingTime = Math.max(1, Math.ceil(rp.content.trim().split(/\s+/).length / wpm));
              return (
                <article
                  key={rp.id}
                  className="flex flex-col justify-between border border-zinc-900/60 bg-zinc-900/10 hover:border-zinc-850 transition-all p-5 rounded-2xl group"
                >
                  <div className="space-y-3.5">
                    <BlogCover
                      src={rp.coverImage}
                      title={rp.title}
                      className="aspect-video rounded-xl border border-zinc-850"
                      imageClassName="object-cover group-hover:scale-102 transition-transform duration-500"
                      sizes="(max-w-768px) 100vw, 33vw"
                    />
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold">
                      <span>{rp.publishedAt ? formatDistanceToNow(new Date(rp.publishedAt)) + " ago" : "Draft"}</span>
                      <span className="h-1 w-1 rounded-full bg-zinc-800" />
                      <span>{rpReadingTime} min read</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                      <Link href={`/blog/${rp.slug}`}>{rp.title}</Link>
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      By {rp.author.name || "Staff Member"}
                    </span>
                    <Link
                      href={`/blog/${rp.slug}`}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center"
                    >
                      Read <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </footer>
      </div>
    </div>
  );
}
