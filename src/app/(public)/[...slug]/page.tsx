import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { constructMetadata } from "@/lib/seo";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  User as UserIcon,
  Tag
} from "lucide-react";
export const dynamic = "force-dynamic";

interface PublicBlogPageProps {
  params: Promise<{ slug?: string[] }>;
}

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }: PublicBlogPageProps) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const headersList = await headers();
  const orgId = headersList.get("x-org-id");

  if (!orgId) {
    return constructMetadata({ title: "Not Found", noIndex: true });
  }

  const orgName = headersList.get("x-org-name") || "Company Blog";

  // If viewing a specific article
  if (slugArray.length === 2) {
    const postSlug = slugArray[1];
    const post = await db.blogPost.findFirst({
      where: {
        organizationId: orgId,
        slug: postSlug,
        published: true,
      },
    });

    if (post) {
      return constructMetadata({
        title: post.seoTitle || `${post.title} | ${orgName}`,
        description: post.seoDescription || post.excerpt || `Read ${post.title} on ${orgName}'s blog.`,
      });
    }
  }

  // If viewing the blog index
  return constructMetadata({
    title: `${orgName} Blog | Insights & Updates`,
    description: `Read the latest articles, guides, and engineering updates from the team at ${orgName}.`,
  });
}

// Helper to format date beautifully
function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// Helper to calculate reading time
function calculateReadingTime(text: string) {
  const wordsPerMinute = 225;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return `${time} min read`;
}

export default async function PublicBlogPage({ params }: PublicBlogPageProps) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  
  const headersList = await headers();
  const orgId = headersList.get("x-org-id");

  // Safeguard: If no verified organization header is present, return 404
  if (!orgId) {
    notFound();
  }

  const brandColor = headersList.get("x-org-brand-color") || "#6366f1";
  const logo = headersList.get("x-org-logo") || "";
  const customFooterText = headersList.get("x-org-footer-text") || "";
  const orgName = headersList.get("x-org-name") || "Company";
  const cleanDomain = slugArray[0] || "";

  // Check if we are viewing the blog feed or a specific post
  const isFeed = slugArray.length <= 1;
  const postSlug = slugArray.length === 2 ? slugArray[1] : null;

  if (slugArray.length > 2) {
    notFound();
  }

  // Inject primary brand color into style scope safely
  const customStyles = {
    "--primary-color": brandColor,
    "--primary-color-hover": `${brandColor}ee`,
    "--primary-color-glow": `${brandColor}22`,
  } as React.CSSProperties;

  if (isFeed) {
    // Fetch all published posts
    const posts = await db.blogPost.findMany({
      where: {
        organizationId: orgId,
        published: true,
      },
      include: {
        author: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    return (
      <div 
        style={customStyles} 
        className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans relative antialiased selection:bg-[var(--primary-color)] selection:text-white"
      >
        {/* Dynamic Glow Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--primary-color)_0%,_transparent_60%)] opacity-10 pointer-events-none z-0 h-[600px]" />

        {/* Global Navigation Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/70 border-b border-zinc-900/80 px-6 py-4 flex items-center justify-between transition-all">
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              {logo ? (
                <div className="relative w-9 h-9 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                  <Image 
                    src={logo} 
                    alt={orgName} 
                    fill 
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--primary-color-glow)]">
                  {orgName.charAt(0)}
                </div>
              )}
              <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 group-hover:to-white transition-all tracking-tight">
                {orgName} <span className="text-[var(--primary-color)] font-medium text-sm tracking-normal ml-1">Blog</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                <Globe className="w-3.5 h-3.5" />
                Custom Domain Active
              </span>
              <Link 
                href="https://saasplatform.com" 
                target="_blank" 
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 font-medium"
              >
                <span>Powered by SaaSPlatform</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 z-10 relative">
          
          {/* Hero Banner Section */}
          <section className="text-center max-w-2xl mx-auto space-y-6 mb-16 py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary-color)]" />
              <span>Latest News & Engineering Updates</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
              Insights from the <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">{orgName}</span> Team
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Explore resources, how-to tutorials, and industry standard insights written by our lead engineers and designers.
            </p>
          </section>

          {/* Posts Layout */}
          {posts.length === 0 ? (
            <div className="text-center py-20 border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-8 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                <BookOpen className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Published Posts</h3>
              <p className="text-sm text-zinc-400">
                Check back soon! The organization hasn&apos;t published any articles to their custom blog yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {posts.map((post) => {
                const _readTime = calculateReadingTime(post.content);
                return (
                  <article 
                    key={post.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-md hover:border-zinc-800/80 hover:bg-zinc-900/40 transition-all hover:scale-[1.01] duration-300 hover:shadow-xl hover:shadow-[var(--primary-color-glow)] p-6"
                  >
                    <div className="space-y-4">
                      {/* Cover Image Placeholder or Real Cover */}
                      <Link href={`/${post.slug}`} className="block relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                        {post.coverImage ? (
                          <Image 
                            src={post.coverImage} 
                            alt={post.title} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)]/20 via-zinc-950 to-zinc-950 flex items-center justify-center p-6 text-center">
                            <BookOpen className="w-12 h-12 text-[var(--primary-color)] opacity-40 group-hover:opacity-80 transition-opacity" />
                          </div>
                        )}
                      </Link>

                      {/* Tag / Meta */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.tags && post.tags.slice(0, 2).map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)] bg-[var(--primary-color-glow)] border border-[var(--primary-color)]/20 px-2.5 py-0.5 rounded-full"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Title & Excerpt */}
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white tracking-tight group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
                          <Link href={`/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h2>
                        <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                          {post.excerpt || "No summary description available for this post. Click read article to inspect."}
                        </p>
                      </div>
                    </div>

                    {/* Author & Footer */}
                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-900/60">
                      <div className="flex items-center gap-2">
                        {post.author.avatarUrl ? (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900">
                            <Image 
                              src={post.author.avatarUrl} 
                              alt={post.author.name || "Author"} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-400 border border-zinc-700">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="text-left">
                          <p className="text-xs font-semibold text-zinc-300">
                            {post.author.name || "Team Member"}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {formatDate(post.publishedAt)}
                          </p>
                        </div>
                      </div>

                      <Link 
                        href={`/${post.slug}`} 
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-color)] hover:text-white transition-colors cursor-pointer group/link"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* Branded Footer */}
        <footer className="border-t border-zinc-900/80 bg-zinc-950 mt-20 px-6 py-12 text-center text-sm text-zinc-500 relative z-10">
          <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="font-semibold text-zinc-400">
              {customFooterText || `© ${new Date().getFullYear()} ${orgName}. All rights reserved.`}
            </p>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                <Globe className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                {cleanDomain}
              </span>
              <Link href="https://saasplatform.com" target="_blank" className="hover:text-zinc-300 transition-colors">
                Privacy
              </Link>
              <Link href="https://saasplatform.com" target="_blank" className="hover:text-zinc-300 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. Fetch specific article
  const post = await db.blogPost.findFirst({
    where: {
      organizationId: orgId,
      slug: postSlug!,
      published: true,
    },
    include: {
      author: {
        select: {
          name: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const readTime = calculateReadingTime(post.content);

  return (
    <div 
      style={customStyles} 
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans relative antialiased selection:bg-[var(--primary-color)] selection:text-white"
    >
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--primary-color)_0%,_transparent_60%)] opacity-10 pointer-events-none z-0 h-[600px]" />

      {/* Global Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/70 border-b border-zinc-900/80 px-6 py-4 flex items-center justify-between transition-all">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {logo ? (
              <div className="relative w-9 h-9 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                <Image 
                  src={logo} 
                  alt={orgName} 
                  fill 
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--primary-color-glow)]">
                {orgName.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 group-hover:to-white transition-all tracking-tight">
              {orgName} <span className="text-[var(--primary-color)] font-medium text-sm tracking-normal ml-1">Blog</span>
            </span>
          </Link>

          <Link 
            href="/" 
            className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold px-4 text-zinc-300 transition-colors border border-zinc-800 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Posts</span>
          </Link>
        </div>
      </header>

      {/* Article Detail Layout */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 z-10 relative">
        <article className="space-y-8">
          
          {/* Post Header */}
          <div className="space-y-6 text-left">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-sm font-bold text-[var(--primary-color)] hover:text-white transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to blog feed</span>
            </Link>

            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {post.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)] bg-[var(--primary-color-glow)] border border-[var(--primary-color)]/20 px-2.5 py-0.5 rounded-full"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-zinc-400 font-medium leading-relaxed border-l-2 border-[var(--primary-color)] pl-4">
                {post.excerpt}
              </p>
            )}

            {/* Author details card */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-y border-zinc-900">
              <div className="flex items-center gap-3">
                {post.author.avatarUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900">
                    <Image 
                      src={post.author.avatarUrl} 
                      alt={post.author.name || "Author"} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-850 flex items-center justify-center text-sm font-semibold text-zinc-400 border border-zinc-700">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-bold text-white">
                    {post.author.name || "Team Member"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Writer at {orgName}
                  </p>
                </div>
              </div>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {readTime}
                </span>
              </div>
            </div>
          </div>

          {/* Large Cover Image */}
          {post.coverImage && (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950 my-6">
              <Image 
                src={post.coverImage} 
                alt={post.title} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Prose Rich Body Content */}
          <div className="prose prose-invert prose-zinc max-w-none pt-4 text-zinc-300 leading-relaxed text-base sm:text-lg space-y-6">
            {post.content.split("\n\n").map((paragraph, index) => {
              // Standard checks for headings, lists, blocks
              if (paragraph.startsWith("### ")) {
                return (
                  <h3 key={index} className="text-xl font-bold text-white tracking-tight pt-4">
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={index} className="text-2xl font-black text-white tracking-tight pt-6 border-b border-zinc-900 pb-2">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("- ") || paragraph.startsWith("* ")) {
                const listItems = paragraph.split("\n");
                return (
                  <ul key={index} className="list-disc list-inside pl-4 space-y-2">
                    {listItems.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-zinc-300">
                        {item.replace(/^[-*]\s+/, "")}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.startsWith("> ")) {
                return (
                  <blockquote key={index} className="border-l-4 border-[var(--primary-color)] bg-zinc-900/30 rounded-r-2xl px-6 py-4 text-zinc-400 italic">
                    {paragraph.replace(/^>\s+/, "")}
                  </blockquote>
                );
              }
              if (paragraph.startsWith("```")) {
                // Code block (strip tags)
                const codeLines = paragraph.split("\n").filter(line => !line.startsWith("```"));
                return (
                  <pre key={index} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 overflow-x-auto text-xs font-mono text-zinc-400 leading-relaxed">
                    <code>{codeLines.join("\n")}</code>
                  </pre>
                );
              }
              
              // Standard paragraph
              return (
                <p key={index} className="whitespace-pre-line text-zinc-300">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Author Bio Box */}
          {post.author.bio && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 mt-16 flex items-start gap-4">
              {post.author.avatarUrl ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex-shrink-0">
                  <Image 
                    src={post.author.avatarUrl} 
                    alt={post.author.name || "Author"} 
                    fill 
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-400 border border-zinc-700 flex-shrink-0">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}
              <div className="text-left space-y-1">
                <h4 className="text-sm font-bold text-white">
                  About the Author: {post.author.name || "Team Member"}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {post.author.bio}
                </p>
              </div>
            </div>
          )}

          {/* Back button */}
          <div className="pt-12 border-t border-zinc-900 flex justify-between items-center">
            <Link 
              href="/" 
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold px-4 text-zinc-300 transition-colors border border-zinc-800 gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all posts</span>
            </Link>

            <span className="text-xs text-zinc-500">
              © {new Date().getFullYear()} {orgName} Blog
            </span>
          </div>

        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 bg-zinc-950 px-6 py-12 text-center text-sm text-zinc-500 relative z-10">
        <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="font-semibold text-zinc-400">
            {customFooterText || `© ${new Date().getFullYear()} ${orgName}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
              <Globe className="w-3.5 h-3.5 text-[var(--primary-color)]" />
              {cleanDomain}
            </span>
            <Link href="https://saasplatform.com" target="_blank" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
            <Link href="https://saasplatform.com" target="_blank" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
