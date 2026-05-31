import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getActiveOrg } from "@/lib/auth";
import { withRateLimit, apiLimiter, getClientIp } from "@/lib/rateLimit";

/**
 * POST endpoint for authenticated users to report/flag a blog post.
 */
async function handler(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const postId = typeof body?.postId === "string" ? body.postId : "";
    const reason = typeof body?.reason === "string" ? body.reason : "";

    if (!postId || reason.trim().length < 3 || reason.length > 500) {
      return NextResponse.json({ error: "Invalid postId or reason" }, { status: 400 });
    }

    const org = await getActiveOrg(user.id);

    // Verify blog post exists and is within org scope
    const post = await db.blogPost.findFirst({
      where: { id: postId, organizationId: org.id, published: true },
      select: { id: true, title: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Create ContentReport entry
    const report = await db.contentReport.create({
      data: {
        postId,
        reason,
        reporterId: user.id,
      },
    });

    // Increment post reportCount
    await db.blogPost.update({
      where: { id: postId },
      data: {
        reportCount: {
          increment: 1,
        },
      },
    });

    // Notify all system administrators
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        db.notification.create({
          data: {
            userId: admin.id,
            title: "Content Reported",
            message: `The post "${post.title}" has been flagged by ${user.name || user.email} for: "${reason}"`,
            type: "WARNING",
            link: `/admin/moderation`,
          },
        })
      )
    );

    return NextResponse.json({ success: true, report });
   
  } catch (error: unknown) {
    console.error("Failed to report content:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(
  apiLimiter,
  async () => `api-report-post-${await getClientIp()}`,
  handler
);

