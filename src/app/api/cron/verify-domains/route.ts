import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import dns from "dns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Get all settings where customDomain is set and status is not verified
    const pendingSettings = await db.organizationSettings.findMany({
      where: {
        customDomain: { not: null },
        domainStatus: { in: ["PENDING", "ERROR"] },
        domainVerificationToken: { not: null },
      },
    });

    const results = {
      total: pendingSettings.length,
      verified: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const setting of pendingSettings) {
      const domain = setting.customDomain!;
      const token = setting.domainVerificationToken!;
      const orgId = setting.organizationId;

      try {
        const txtRecords = await dns.promises.resolveTxt(domain);
        const flatRecords = txtRecords.flat();
        const expectedValue = `txt-domain-verification=${token}`;
        const isVerified = flatRecords.some(record => record.trim() === expectedValue);

        if (isVerified) {
          await db.organizationSettings.update({
            where: { organizationId: orgId },
            data: {
              domainStatus: "VERIFIED",
              domainVerifiedAt: new Date(),
            },
          });
          results.verified += 1;
        } else {
          await db.organizationSettings.update({
            where: { organizationId: orgId },
            data: { domainStatus: "ERROR" },
          });
          results.failed += 1;
        }
       
      } catch (dnsErr: unknown) {
        // Log dns error and update status to error
        const message = dnsErr instanceof Error ? dnsErr.message : "Unknown DNS error";
        await db.organizationSettings.update({
          where: { organizationId: orgId },
          data: { domainStatus: "ERROR" },
        });
        results.failed += 1;
        results.errors.push(`DNS failed for ${domain}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.total} pending domains. Verified: ${results.verified}. Failed/Unchanged: ${results.failed}.`,
      errors: results.errors,
    });
   
  } catch (error: unknown) {
    console.error("Cron domain verification failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}
