import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getOrganizationMembership } from "@/lib/auth";
import dns from "dns";
import { withRateLimit, apiLimiter, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

async function handler(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = z.object({ orgId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }
    const { orgId } = parsed.data;

    const membership = await getOrganizationMembership(orgId);
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden. Admins or Owners only." }, { status: 403 });
    }

    const settings = await db.organizationSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (!settings || !settings.customDomain) {
      return NextResponse.json({ error: "No custom domain configured" }, { status: 400 });
    }

    const domain = settings.customDomain;
    const token = settings.domainVerificationToken;

    if (!token) {
      return NextResponse.json({ error: "No verification token found" }, { status: 400 });
    }

    // Resolve TXT records of the custom domain
    let txtRecords: string[][] = [];
    try {
      txtRecords = await dns.promises.resolveTxt(domain);
     
    } catch (dnsErr: unknown) {
      const message = dnsErr instanceof Error ? dnsErr.message : "Unknown DNS error";
      console.warn("DNS resolution failed for", domain, message);
      // Update status to ERROR in DB
      await db.organizationSettings.update({
        where: { organizationId: orgId },
        data: { domainStatus: "ERROR" },
      });
      return NextResponse.json({ 
        verified: false, 
        status: "ERROR",
        message: `DNS Lookup failed: TXT record not found or propagation pending.` 
      });
    }

    // Flatten records to look for the verification token
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
      return NextResponse.json({ verified: true, status: "VERIFIED" });
    } else {
      await db.organizationSettings.update({
        where: { organizationId: orgId },
        data: { domainStatus: "ERROR" },
      });
      return NextResponse.json({ 
        verified: false, 
        status: "ERROR",
        message: `TXT records resolved but none matched. Expected "${expectedValue}".` 
      });
    }
  } catch (error) {
    console.error("Domain verification failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withRateLimit(
  apiLimiter,
  async () => `api-verify-domain-post-${await getClientIp()}`,
  handler
);
