import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

// Avoid build-time DB access (e.g. during `next build` page-data collection).
export const dynamic = "force-dynamic";

export const alt = "Blog Post Image";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let title = "Blog Post Details";
  let authorName = "Staff Writer";
  let tags = "Engineering";

  try {
    // Query details from the DB in Node.js context safely
    const post = await db.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });

    title = post?.title || title;
    authorName = post?.author?.name || authorName;
    tags = post?.tags?.join(" • ") || tags;
  } catch {
    // Fail-safe: keep OG generation working without DB.
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(to bottom right, #09090b, #1b1917, #09090b)",
          padding: "80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Border accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(to right, #6366f1, #a855f7)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <span style={{ fontSize: "16px", textTransform: "uppercase", fontWeight: "805", color: "#6366f1", letterSpacing: "0.15em" }}>
            {tags}
          </span>
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#ffffff" }}>
            Boilerplate<span style={{ color: "#6366f1" }}>Pro</span>
          </span>
        </div>

        {/* Title and Excerpt */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "950px" }}>
          <h1 style={{ fontSize: "60px", fontWeight: "900", lineHeight: "1.15", margin: 0, letterSpacing: "-0.03em" }}>
            {title}
          </h1>
          <p style={{ fontSize: "22px", color: "#a1a1aa", margin: 0 }}>
            Written by {authorName}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", color: "#71717a", fontSize: "16px" }}>
          <span>https://boilerplate-pro.com/blog/{slug}</span>
          <span>Read full article online ➔</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
