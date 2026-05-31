import { db } from "@/lib/db";
import Link from "next/link";

// Avoid build-time DB access (e.g. during `next build` page-data collection).
export const dynamic = "force-dynamic";

import { ArrowRight, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Prisma } from "@prisma/client";

import { constructMetadata } from "@/lib/seo";
import { BlogAvatar, BlogCover } from "@/components/shared/BlogMedia";

export const metadata = constructMetadata({
  title: "Engineering Blog & Resources",
  description: "Read the latest guides, software updates, and tutorials from the boilerplate engineering team.",
  canonical: "https://boilerplate-pro.com/blog",
});

interface BlogPageProps {
  searchParams: Promise<{ tag?: string; page?: string }>;
}

export default async function BlogPage(props: BlogPageProps) {
  const searchParams = await props.searchParams;
  const activeTag = searchParams.tag;
  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10));
  const postsPerPage = 6;

  // 1. Build Query Constraints
   
  const whereClause: Prisma.BlogPostWhereInput = {
    published: true,
  };
  if (activeTag) {
    whereClause.tags = {
      has: activeTag,
    };
  }

  // 2. Fetch Paginated Posts & Stats
  const totalPosts = await db.blogPost.count({ where: whereClause });
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const posts = await db.blogPost.findMany({
    where: whereClause,
    orderBy: { publishedAt: "desc" },
    skip: (currentPage - 1) * postsPerPage,
    take: postsPerPage,
    include: {
      author: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  // 3. Extract All Active Tags from DB for filter panel
  const tagsData = await db.blogPost.findMany({
    where: { published: true },
    select: { tags: true },
  });
  const uniqueTags = Array.from(new Set(tagsData.flatMap((p) => p.tags)));

  // Identify Featured Post (First post of the first page)
  const featuredPost = currentPage === 1 ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  // Simple reading time estimator helper
  const getReadingTime = (text: string) => {
    const wpm = 225;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wpm);
  };

  return (
    <div className="relative isolate overflow-hidden bg-zinc-950 text-white min-h-screen py-24 sm:py-32">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-indigo-900)_0%,_transparent_60%)] opacity-20 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Resources & Updates
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Latest from our Engineering Team
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Stay up to date with core product releases, technical insights, and step-by-step artificial intelligence tutorials.
          </p>
        </div>

        {/* Tag Filters Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <Link
            href="/blog"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !activeTag
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            All Posts
          </Link>
          {uniqueTags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeTag === tag
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              #{tag}
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-20 border border-dashed border-zinc-850 rounded-3xl max-w-lg mx-auto bg-zinc-900/10">
            <p className="text-sm text-zinc-400">No blog posts found under this criteria.</p>
            <Link href="/blog" className="text-indigo-400 text-xs font-bold mt-4 inline-flex items-center gap-1 hover:underline">
              Clear filters <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Featured Hero Post Block */}
        {featuredPost && (
          <div className="max-w-5xl mx-auto border border-zinc-900 bg-zinc-900/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center hover:border-zinc-800 transition-colors">
            <BlogCover
              src={featuredPost.coverImage}
              title={featuredPost.title}
              className="w-full md:w-1/2 aspect-video rounded-2xl border border-zinc-850"
              imageClassName="object-cover hover:scale-102 transition-transform duration-550"
              sizes="(max-w-768px) 100vw, 50vw"
              priority
            />
            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium">
                <span className="text-indigo-400 font-bold uppercase tracking-wider">Featured</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {featuredPost.publishedAt
                    ? formatDistanceToNow(new Date(featuredPost.publishedAt)) + " ago"
                    : "Draft"}
                </span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getReadingTime(featuredPost.content)} min read
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight hover:text-indigo-400 transition-colors">
                <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {featuredPost.excerpt || "Read full design logs detailing the integration and build steps."}
              </p>
              {featuredPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {featuredPost.tags.map((t) => (
                    <span key={t} className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-900/60">
                <div className="flex items-center gap-2">
                  <BlogAvatar
                    src={featuredPost.author.avatarUrl}
                    name={featuredPost.author.name}
                    sizeClassName="h-7 w-7"
                    imageSize={28}
                    fallbackClassName="text-[10px]"
                  />
                  <span className="text-xs font-semibold text-zinc-300">
                    {featuredPost.author.name || "Staff Member"}
                  </span>
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Read Article <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        {gridPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                className="flex flex-col justify-between border border-zinc-900/60 bg-zinc-900/10 hover:border-zinc-850 transition-colors p-5 rounded-2xl group"
              >
                <div className="space-y-4">
                  <BlogCover
                    src={post.coverImage}
                    title={post.title}
                    className="aspect-video rounded-xl border border-zinc-850"
                    imageClassName="object-cover group-hover:scale-102 transition-transform duration-500"
                    sizes="(max-w-768px) 100vw, 33vw"
                  />
                  <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {post.publishedAt
                        ? formatDistanceToNow(new Date(post.publishedAt)) + " ago"
                        : "Draft"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-800" />
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {getReadingTime(post.content)} min read
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {post.excerpt || "Read full deployment parameters and software releases."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BlogAvatar
                      src={post.author.avatarUrl}
                      name={post.author.name}
                      sizeClassName="h-6 w-6"
                      imageSize={24}
                      fallbackClassName="text-[9px]"
                    />
                    <span className="text-[11px] font-semibold text-zinc-300">
                      {post.author.name || "Staff Member"}
                    </span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300 inline-flex items-center gap-0.5"
                  >
                    Read <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 4. Pagination Actions */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <Link
              href={
                currentPage > 1
                  ? `/blog?page=${currentPage - 1}${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`
                  : "#"
              }
              className={`flex items-center gap-1 px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${
                currentPage > 1
                  ? "border-zinc-800 text-white hover:bg-zinc-900"
                  : "border-zinc-950 text-zinc-700 pointer-events-none"
              }`}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
            <span className="text-xs font-medium text-zinc-500">
              Page {currentPage} of {totalPages}
            </span>
            <Link
              href={
                currentPage < totalPages
                  ? `/blog?page=${currentPage + 1}${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`
                  : "#"
              }
              className={`flex items-center gap-1 px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${
                currentPage < totalPages
                  ? "border-zinc-800 text-white hover:bg-zinc-900"
                  : "border-zinc-950 text-zinc-700 pointer-events-none"
              }`}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
