import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_CONFIG } from "@/lib/constants";

// Avoid build-time DB access (common in CI/CD where DB isn't available during build).
export const dynamic = "force-dynamic";
// Cache sitemap for 1 hour at the edge/server layer.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;

  // 1. Static marketing paths
  const routes = ["", "/pricing", "/features", "/blog"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // 2. Fetch all published blog posts from Prisma DB
  try {
    const posts = await db.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    const blogRoutes = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...routes, ...blogRoutes];
  } catch {
    // Fail-safe: serve marketing routes even if DB is unavailable.
    return routes;
  }
}
