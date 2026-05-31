import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === "x-forwarded-for") return "192.168.1.1";
      return null;
    }),
  }),
}));

import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

const mockAuditLogCreate = db.auditLog.create as ReturnType<typeof vi.fn>;

// ─── writeAuditLog ────────────────────────────────────────────────────────────

describe("writeAuditLog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an audit log record with correct fields", async () => {
    mockAuditLogCreate.mockResolvedValue({ id: "audit_1" });

    await writeAuditLog({
      userId: "user_1",
      action: "USER_UPDATED",
      targetType: "User",
      targetId: "user_1",
      metadata: { field: "email" },
    });

    expect(mockAuditLogCreate).toHaveBeenCalledOnce();
    const callArg = mockAuditLogCreate.mock.calls[0][0];
    expect(callArg.data.userId).toBe("user_1");
    expect(callArg.data.action).toBe("USER_UPDATED");
    expect(callArg.data.targetType).toBe("User");
    expect(callArg.data.targetId).toBe("user_1");
  });

  it("resolves the client IP from x-forwarded-for header", async () => {
    mockAuditLogCreate.mockResolvedValue({ id: "audit_2" });

    await writeAuditLog({
      action: "BLOG_PUBLISHED",
      targetType: "BlogPost",
    });

    const callArg = mockAuditLogCreate.mock.calls[0][0];
    expect(callArg.data.ipAddress).toBe("192.168.1.1");
  });

  it("stores null userId when not provided", async () => {
    mockAuditLogCreate.mockResolvedValue({ id: "audit_3" });

    await writeAuditLog({ action: "SYSTEM_EVENT", targetType: "System" });

    const callArg = mockAuditLogCreate.mock.calls[0][0];
    expect(callArg.data.userId).toBeNull();
  });

  it("stores null targetId when not provided", async () => {
    mockAuditLogCreate.mockResolvedValue({ id: "audit_4" });

    await writeAuditLog({ action: "SYSTEM_EVENT", targetType: "System" });

    const callArg = mockAuditLogCreate.mock.calls[0][0];
    expect(callArg.data.targetId).toBeNull();
  });

  it("falls back to system-context IP when headers() throws", async () => {
    const { headers } = await import("next/headers");
    (headers as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("no headers"));
    mockAuditLogCreate.mockResolvedValue({ id: "audit_5" });

    await writeAuditLog({ action: "CRON_RUN", targetType: "System" });

    const callArg = mockAuditLogCreate.mock.calls[0][0];
    expect(callArg.data.ipAddress).toBe("system-context");
  });

  it("returns null without throwing when DB write fails (fail-safe)", async () => {
    // Both primary and fallback writes fail
    mockAuditLogCreate.mockRejectedValue(new Error("DB down"));

    const result = await writeAuditLog({ action: "FAIL_TEST", targetType: "System" });

    expect(result).toBeNull();
  });

  it("returns the created audit log record on success", async () => {
    const mockRecord = { id: "audit_ok", action: "TEST" };
    mockAuditLogCreate.mockResolvedValue(mockRecord);

    const result = await writeAuditLog({ action: "TEST", targetType: "System" });

    expect(result).toEqual(mockRecord);
  });
});
