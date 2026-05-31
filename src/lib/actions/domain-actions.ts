"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, getOrganizationMembership } from "@/lib/auth";
import crypto from "crypto";
import dns from "dns";
import { z } from "zod";

const DomainSchema = z.string()
  .min(3, "Domain name is too short")
  .max(253, "Domain name is too long")
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    "Invalid domain format. Enter a valid hostname (e.g. docs.company.com)"
  );

const BrandSchema = z.object({
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format. Use hex (e.g. #6366f1)"),
  customFooterText: z.string().max(200, "Footer text must be 200 characters or less"),
  logoUrl: z.string().url("Invalid logo URL").or(z.literal("")).nullable(),
});

/**
 * Saves or updates the custom domain settings for an organization.
 */
export async function saveCustomDomain(orgId: string, rawDomain: string) {
  const user = await requireAuth();
  
  // 1. Verify user role in organization
  const membership = await getOrganizationMembership(orgId);
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Only organization Owners and Admins can manage custom domains.");
  }

  // 2. Standardize & Validate domain
  const cleanDomain = rawDomain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
  DomainSchema.parse(cleanDomain);

  // 3. Prevent duplicate domain registrations
  const duplicate = await db.organizationSettings.findFirst({
    where: {
      customDomain: cleanDomain,
      organizationId: { not: orgId },
    },
  });

  if (duplicate) {
    throw new Error("This custom domain is already registered to another organization.");
  }

  // 4. Generate verification token & save settings
  const verificationToken = crypto.randomBytes(16).toString("hex");

  const settings = await db.organizationSettings.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      customDomain: cleanDomain,
      domainVerificationToken: verificationToken,
      domainStatus: "PENDING",
    },
    update: {
      customDomain: cleanDomain,
      domainVerificationToken: verificationToken,
      domainStatus: "PENDING",
      domainVerifiedAt: null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `Configured Custom Domain: ${cleanDomain}`,
      targetType: "OrganizationSettings",
      targetId: settings.id,
    },
  });

  revalidatePath(`/settings/domain`);
  return settings;
}

/**
 * Saves the brand settings (color, footer, logo) for an organization.
 */
export async function saveBrandSettings(
  orgId: string,
  brandColor: string,
  customFooterText: string,
  logoUrl: string | null
) {
  const user = await requireAuth();

  // 1. Verify user role
  const membership = await getOrganizationMembership(orgId);
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Only organization Owners and Admins can update branding.");
  }

  // 2. Validate parameters
  BrandSchema.parse({ brandColor, customFooterText, logoUrl });

  // 3. Update DB
  const settings = await db.organizationSettings.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      brandColor,
      customFooterText,
    },
    update: {
      brandColor,
      customFooterText,
    },
  });

  if (logoUrl !== undefined) {
    await db.organization.update({
      where: { id: orgId },
      data: { logo: logoUrl },
    });
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "Updated Brand Settings",
      targetType: "OrganizationSettings",
      targetId: settings.id,
    },
  });

  revalidatePath(`/settings/domain`);
  return settings;
}

/**
 * Server action to verify DNS TXT record for custom domain.
 */
export async function verifyDomainDNS(orgId: string) {
  const user = await requireAuth();

  const membership = await getOrganizationMembership(orgId);
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Only Owners and Admins can verify custom domains.");
  }

  const settings = await db.organizationSettings.findUnique({
    where: { organizationId: orgId },
  });

  if (!settings || !settings.customDomain) {
    throw new Error("No custom domain configured.");
  }

  const domain = settings.customDomain;
  const token = settings.domainVerificationToken;

  if (!token) {
    throw new Error("No verification token found.");
  }

  try {
    const txtRecords = await dns.promises.resolveTxt(domain);
    const flatRecords = txtRecords.flat();
    const expectedValue = `txt-domain-verification=${token}`;
    const isVerified = flatRecords.some(record => record.trim() === expectedValue);

    if (isVerified) {
       
      const _updated = await db.organizationSettings.update({
        where: { organizationId: orgId },
        data: {
          domainStatus: "VERIFIED",
          domainVerifiedAt: new Date(),
        },
      });

      await db.auditLog.create({
        data: {
          userId: user.id,
          action: `Successfully verified domain: ${domain}`,
          targetType: "OrganizationSettings",
          targetId: settings.id,
        },
      });

      revalidatePath(`/settings/domain`);
      return { success: true, status: "VERIFIED" };
    } else {
      await db.organizationSettings.update({
        where: { organizationId: orgId },
        data: { domainStatus: "ERROR" },
      });

      revalidatePath(`/settings/domain`);
      return { 
        success: false, 
        status: "ERROR", 
        message: `TXT records found, but verification token mismatched. Expected "${expectedValue}".` 
      };
    }
   
  } catch (_dnsErr: unknown) {
    await db.organizationSettings.update({
      where: { organizationId: orgId },
      data: { domainStatus: "ERROR" },
    });

    revalidatePath(`/settings/domain`);
    return { 
      success: false, 
      status: "ERROR", 
      message: `DNS TXT record lookup failed: TXT record not found or propagation pending.` 
    };
  }
}
