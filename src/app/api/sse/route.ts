import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getActiveOrg } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLL_INTERVAL_MS = 4000;
const HEARTBEAT_INTERVAL_MS = 25000;

const LAST_SEEN_KEY = (userId: string, connId: string) => `sse:last-seen:${userId}:${connId}`;

type Cursor = { t: string; id: string };

const parseCursor = (value: string | null): Cursor | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Cursor;
    if (typeof parsed?.t === "string" && typeof parsed?.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const org = await getActiveOrg(user.id).catch(() => null);

    const userId = user.id;
    const orgId = org?.id;

    const connId = crypto.randomUUID();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;

        const enqueue = (event: string, data: unknown) => {
          if (closed) return;
          try {
            const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(payload));
          } catch {
            // stream already closed
          }
        };

        const close = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            /* ignore */
          }
        };

        enqueue("connected", { status: "success", userId, orgId });

        let cursor: Cursor | null = null;
        try {
          const latest = await db.notification.findFirst({
            where: { userId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { id: true, createdAt: true },
          });

          if (latest) {
            cursor = { t: latest.createdAt.toISOString(), id: latest.id };
            await redis.set(LAST_SEEN_KEY(userId, connId), JSON.stringify(cursor), { ex: 120 });
          }
        } catch (err) {
          logger.warn({ err, userId }, "SSE: failed to seed cursor");
        }

        const pollInterval = setInterval(async () => {
          if (closed) {
            clearInterval(pollInterval);
            return;
          }

          try {
            const stored = await redis.get<string>(LAST_SEEN_KEY(userId, connId));
            const restored = parseCursor(stored);
            if (restored) cursor = restored;

            const cursorDate = cursor ? new Date(cursor.t) : null;

            const newNotifications = await db.notification.findMany({
              where: {
                userId,
                ...(cursor && cursorDate
                  ? {
                      OR: [
                        { createdAt: { gt: cursorDate } },
                        { createdAt: cursorDate, id: { gt: cursor.id } },
                      ],
                    }
                  : {}),
              },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              take: 20,
            });

            for (const notification of newNotifications) {
              enqueue("notification", notification);
              cursor = { t: notification.createdAt.toISOString(), id: notification.id };
            }

            if (cursor) {
              await redis.set(LAST_SEEN_KEY(userId, connId), JSON.stringify(cursor), { ex: 120 });
            }
          } catch (err) {
            logger.error({ err, userId }, "SSE: poll cycle failed");
          }
        }, POLL_INTERVAL_MS);

        const heartbeatInterval = setInterval(() => {
          enqueue("ping", { time: Date.now() });
        }, HEARTBEAT_INTERVAL_MS);

        req.signal.addEventListener("abort", async () => {
          clearInterval(pollInterval);
          clearInterval(heartbeatInterval);
          close();
          try {
            await redis.del(LAST_SEEN_KEY(userId, connId));
          } catch {
            /* ignore */
          }
        });
      },

      cancel() {
        // handled by abort listener above
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    logger.error({ error }, "SSE: failed to initialize connection");
    return new NextResponse("Unauthorized", { status: 401 });
  }
}
