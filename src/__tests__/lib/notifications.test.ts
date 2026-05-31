import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/realtime", () => ({
  publishToUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/resend", () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { publishToUser } from "@/lib/realtime";
import { createNotification, createBulkNotifications } from "@/lib/notifications";

const dbNotificationCreate = db.notification.create as ReturnType<typeof vi.fn>;
const dbNotificationCreateMany = db.notification.createMany as ReturnType<typeof vi.fn>;
const publishToUserMock = publishToUser as ReturnType<typeof vi.fn>;

// ─── createNotification ───────────────────────────────────────────────────────

describe("createNotification", () => {
  beforeEach(() => vi.clearAllMocks());

  const baseNotification = {
    id: "notif_1",
    userId: "user_1",
    title: "Test Title",
    message: "Test message body",
    type: "INFO" as const,
    read: false,
    readAt: null,
    link: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("creates a notification in the database", async () => {
    dbNotificationCreate.mockResolvedValue(baseNotification);

    const result = await createNotification({
      userId: "user_1",
      title: "Test Title",
      message: "Test message body",
    });

    expect(dbNotificationCreate).toHaveBeenCalledOnce();
    expect(dbNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_1",
          title: "Test Title",
          message: "Test message body",
          type: "INFO",
        }),
      }),
    );
    expect(result).toEqual(baseNotification);
  });

  it("publishes a real-time event after creating the notification", async () => {
    dbNotificationCreate.mockResolvedValue(baseNotification);

    await createNotification({
      userId: "user_1",
      title: "Test Title",
      message: "Test message body",
    });

    expect(publishToUserMock).toHaveBeenCalledOnce();
    expect(publishToUserMock).toHaveBeenCalledWith(
      "user_1",
      "notification",
      baseNotification,
    );
  });

  it("uppercases the type correctly — warning → WARNING", async () => {
    dbNotificationCreate.mockResolvedValue({ ...baseNotification, type: "WARNING" });

    await createNotification({
      userId: "user_1",
      title: "Warning",
      message: "Something needs attention",
      type: "warning",
    });

    expect(dbNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "WARNING" }),
      }),
    );
  });

  it("stores the link when provided", async () => {
    dbNotificationCreate.mockResolvedValue({ ...baseNotification, link: "/billing" });

    await createNotification({
      userId: "user_1",
      title: "Billing",
      message: "Payment failed",
      link: "/billing",
    });

    expect(dbNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ link: "/billing" }),
      }),
    );
  });

  it("stores null link when not provided", async () => {
    dbNotificationCreate.mockResolvedValue(baseNotification);

    await createNotification({
      userId: "user_1",
      title: "No link",
      message: "No link notification",
    });

    expect(dbNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ link: null }),
      }),
    );
  });

  it("throws when the DB write fails", async () => {
    dbNotificationCreate.mockRejectedValue(new Error("DB connection lost"));

    await expect(
      createNotification({ userId: "user_1", title: "T", message: "M" }),
    ).rejects.toThrow("DB connection lost");
  });
});

// ─── createBulkNotifications ──────────────────────────────────────────────────

describe("createBulkNotifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createMany with all user IDs", async () => {
    dbNotificationCreateMany.mockResolvedValue({ count: 3 });

    await createBulkNotifications(["u1", "u2", "u3"], {
      title: "Bulk Title",
      message: "Bulk message",
    });

    expect(dbNotificationCreateMany).toHaveBeenCalledOnce();
    const callArg = dbNotificationCreateMany.mock.calls[0][0];
    expect(callArg.data).toHaveLength(3);
    expect(callArg.data[0].userId).toBe("u1");
    expect(callArg.data[1].userId).toBe("u2");
    expect(callArg.data[2].userId).toBe("u3");
  });

  it("publishes a real-time event for each user", async () => {
    dbNotificationCreateMany.mockResolvedValue({ count: 2 });

    await createBulkNotifications(["u1", "u2"], {
      title: "Bulk",
      message: "Message",
    });

    expect(publishToUserMock).toHaveBeenCalledTimes(2);
    expect(publishToUserMock).toHaveBeenCalledWith("u1", "notification", expect.any(Object));
    expect(publishToUserMock).toHaveBeenCalledWith("u2", "notification", expect.any(Object));
  });

  it("returns the createMany result", async () => {
    dbNotificationCreateMany.mockResolvedValue({ count: 2 });

    const result = await createBulkNotifications(["u1", "u2"], {
      title: "T",
      message: "M",
    });

    expect(result).toEqual({ count: 2 });
  });

  it("throws when the DB write fails", async () => {
    dbNotificationCreateMany.mockRejectedValue(new Error("DB error"));

    await expect(
      createBulkNotifications(["u1"], { title: "T", message: "M" }),
    ).rejects.toThrow("DB error");
  });

  it("defaults type to INFO when not specified", async () => {
    dbNotificationCreateMany.mockResolvedValue({ count: 1 });

    await createBulkNotifications(["u1"], { title: "T", message: "M" });

    const callArg = dbNotificationCreateMany.mock.calls[0][0];
    expect(callArg.data[0].type).toBe("INFO");
  });

  it("uses the provided type uppercased", async () => {
    dbNotificationCreateMany.mockResolvedValue({ count: 1 });

    await createBulkNotifications(["u1"], {
      title: "T",
      message: "M",
      type: "error",
    });

    const callArg = dbNotificationCreateMany.mock.calls[0][0];
    expect(callArg.data[0].type).toBe("ERROR");
  });
});
