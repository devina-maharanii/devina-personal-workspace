import { db } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, apiLimiter, getClientIp } from "@/lib/rateLimit";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET list of notifications for the authenticated user.
 * Supports cursor-based pagination (preferred) via `cursor` param,
 * or legacy offset pagination via `page` param for backward compatibility.
 */
async function handlerGET(req: NextRequest) {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Retrieve matching db user ID
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all"; // "all" | "unread" | "read"
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  // Cursor-based pagination — preferred over offset/page for performance
  const cursor = searchParams.get("cursor") || null;

  // Legacy offset support (still used by NotificationBell which passes page=1)
  const legacyPage = parseInt(searchParams.get("page") || "1", 10);
  const legacySkip = cursor ? 0 : (legacyPage - 1) * limit;

   
  const where: Prisma.NotificationWhereInput = { userId: user.id };
  if (status === "unread") {
    where.read = false;
  } else if (status === "read") {
    where.read = true;
  }

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1, // fetch one extra to determine if there's a next page
        ...(cursor
          ? { cursor: { id: cursor }, skip: 1 } // skip the cursor item itself
          : { skip: legacySkip }),
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    // Determine if there are more results and extract the next cursor
    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      notifications: items,
      total,
      unreadCount,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Failed to query notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST endpoint for handling bulk actions (markRead, delete).
 */
async function handlerPOST(req: NextRequest) {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = z
      .object({
        action: z.enum(["markRead", "delete"]),
        ids: z.array(z.string().min(1)).min(1).max(200),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid notification IDs list." }, { status: 400 });
    }

    const { action, ids } = parsed.data;

    if (action === "markRead") {
      const result = await db.notification.updateMany({
        where: {
          id: { in: ids },
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    if (action === "delete") {
      const result = await db.notification.deleteMany({
        where: {
          id: { in: ids },
          userId: user.id,
        },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ error: "Invalid action type." }, { status: 400 });
  } catch (error) {
    console.error("Failed to perform bulk actions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withRateLimit(
  apiLimiter,
  async () => `api-notifications-get-${await getClientIp()}`,
  handlerGET
);

export const POST = withRateLimit(
  apiLimiter,
  async () => `api-notifications-post-${await getClientIp()}`,
  handlerPOST
);


