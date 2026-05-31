import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Authorize CRON request (using case-insensitive authorization check)
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Remove orphaned DB File records (where UploadThing file returned a 404 status)
    const dbFiles = await db.file.findMany();
    let deletedFilesCount = 0;

    for (const file of dbFiles) {
      try {
        const response = await fetch(file.url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        if (response.status === 404) {
          await db.file.delete({
            where: { id: file.id },
          });
          deletedFilesCount++;
        }
      } catch (err) {
        // If we timeout or experience network degradation, we do NOT delete the database record.
        console.error(`Error checking file ${file.id} accessibility:`, err);
      }
    }

    // 3. Clear WebhookDelivery logs older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedLogs = await db.webhookDelivery.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedFilesCount,
      deletedLogsCount: deletedLogs.count,
    });
   
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Cron cleanup job failed:", error);
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}
