import { afterEach, describe, expect, it, vi } from "vitest";
import { processNotificationRequested } from "./notification.js";
import * as logger from "../logger.js";

const notificationJob = {
  id: "44444444-4444-4444-4444-444444444444",
  merchantId: "11111111-1111-1111-1111-111111111111",
  type: "order_ready_for_pickup" as const,
  channel: "sms_placeholder" as const,
  recipient: "+233244123456",
  payload: {
    orderId: "22222222-2222-2222-2222-222222222222",
    orderReference: "ORD-1001",
    merchantId: "11111111-1111-1111-1111-111111111111",
  },
  status: "queued" as const,
  bullJobId: null,
  providerMessageId: null,
  errorMessage: null,
  createdAt: new Date(),
  sentAt: null,
};

vi.mock("../lib/db.js", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([notificationJob])),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe("processNotificationRequested", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid bull payload", async () => {
    await expect(
      processNotificationRequested({
        id: "job-1",
        data: { notificationJobId: "not-a-uuid" },
      } as Parameters<typeof processNotificationRequested>[0]),
    ).rejects.toThrow();
  });

  it("marks notification sent for valid placeholder dispatch", async () => {
    const spy = vi.spyOn(logger, "logWorkerEvent").mockImplementation(() => {});

    const result = await processNotificationRequested({
      id: "job-123",
      data: {
        notificationJobId: "44444444-4444-4444-4444-444444444444",
      },
    } as Parameters<typeof processNotificationRequested>[0]);

    expect(result.status).toBe("sent");
    const dispatchEvent = spy.mock.calls.find(
      ([, event]) =>
        typeof event === "object" &&
        event !== null &&
        "type" in event &&
        event.type === "notification_dispatch_placeholder",
    );
    expect(dispatchEvent).toBeDefined();
  });
});
