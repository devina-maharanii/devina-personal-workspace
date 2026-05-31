import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainParam = searchParams.get("domain");
    const parsed = z.string().min(1).max(255).safeParse(domainParam);
    if (!parsed.success) {
      return NextResponse.json({ error: "Domain parameter required" }, { status: 400 });
    }

    // Standardize domain (lowercase, remove www.)
    const cleanDomain = parsed.data.toLowerCase().trim().replace(/^www\./, "");
    const domainRegex =
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d+)?$/;
    if (!cleanDomain || !domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    const settings = await db.organizationSettings.findFirst({
      where: {
        customDomain: cleanDomain,
        domainStatus: "VERIFIED",
      },
      include: {
        organization: true,
      },
    });

    if (!settings) {
      return NextResponse.json({ error: "Organization not found for domain" }, { status: 404 });
    }

    return NextResponse.json({
      orgId: settings.organizationId,
      slug: settings.organization.slug,
      name: settings.organization.name,
      logo: settings.organization.logo,
      brandColor: settings.brandColor || "#6366f1",
      customFooterText: settings.customFooterText || "",
    });
  } catch (error) {
    console.error("Resolve domain API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
