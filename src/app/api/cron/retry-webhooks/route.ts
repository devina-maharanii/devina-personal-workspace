import { NextResponse } from "next/server";
import { retryFailedWebhooks } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new NextResponse("CRON_SECRET not set", { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await retryFailedWebhooks();
    return NextResponse.json({ success: true, message: "Webhook retry job completed" });
  } catch (error) {
    console.error("Cron Error (retryFailedWebhooks):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
