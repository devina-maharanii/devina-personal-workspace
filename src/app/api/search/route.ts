import { NextResponse } from "next/server";
import { getCurrentUser, getActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { cache, CACHE_KEYS } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getActiveOrg(user.id);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ posts: [], members: [], files: [] });
    }

    // Cache search results for 30 s per org + query
    const results = await cache(
      CACHE_KEYS.search(org.id, query),
      async () => {
        // Execute searches in parallel
        const [posts, members, files] = await Promise.all([
          db.blogPost.findMany({
            where: {
              organizationId: org.id,
              title: { contains: query, mode: "insensitive" },
            },
            take: 5,
            select: {
              id: true,
              title: true,
              slug: true,
              published: true,
            },
          }),
          db.membership.findMany({
            where: {
              organizationId: org.id,
              user: {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              },
            },
            take: 5,
            include: {
              user: {
                select: { name: true, email: true, avatarUrl: true },
              },
            },
          }),
          db.file.findMany({
            where: {
              organizationId: org.id,
              name: { contains: query, mode: "insensitive" },
            },
            take: 5,
            select: {
              id: true,
              name: true,
              url: true,
              size: true,
              mimeType: true,
            },
          }),
        ]);

        return {
          posts,
          members: members.map((m) => ({
            id: m.id,
            role: m.role,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
          })),
          files,
        };
      },
      30, // 30 second TTL for search results
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
