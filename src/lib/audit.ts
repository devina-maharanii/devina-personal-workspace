import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";

interface AuditLogInput {
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
   
  metadata?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Centrally writes a structured record to the database AuditLog table,
 * resolving the client caller's IP address dynamically using Next.js HTTP headers.
 */
export async function writeAuditLog(input: AuditLogInput) {
  try {
    let ipAddress: string | null = "127.0.0.1";

    try {
      const headersList = await headers();
      const xForwardedFor = headersList.get("x-forwarded-for");
      const xRealIp = headersList.get("x-real-ip");

      if (xForwardedFor) {
        // x-forwarded-for can be a comma-separated list of IPs. The first one is the client.
        ipAddress = xForwardedFor.split(",")[0].trim();
      } else if (xRealIp) {
        ipAddress = xRealIp.trim();
      }
     
    } catch (_headerError) {
      // In certain serverless execution pipelines or non-HTTP environments (e.g. seed scripts/some build scripts),
      // calling headers() will throw. We catch it and fallback.
      ipAddress = "system-context";
    }

    return await db.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId || null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Centralized audit logging failed:", error);
    
    // Fail-safe wrapper to ensure system mutations are never blocked by logging failures
    try {
      const baseMetadata = isRecord(input.metadata) ? input.metadata : {};
      return await db.auditLog.create({
        data: {
          userId: input.userId || null,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId || null,
          metadata: { ...baseMetadata, loggingError: true } as Prisma.InputJsonValue,
          ipAddress: "unknown-error",
        },
      });
    } catch (dbFallbackError) {
      console.error("Fatal fallback audit logging failure:", dbFallbackError);
      return null;
    }
  }
}
