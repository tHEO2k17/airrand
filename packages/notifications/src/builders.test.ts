import { describe, expect, it } from "vitest";
import {
  buildAuditExportCompletedNotification,
  buildOrderReadyForPickupNotification,
  buildStaffPasswordResetNotification,
  validateNotificationPayload,
  NOTIFICATION_TYPES,
} from "@airrand/notifications";

describe("notification builders", () => {
  it("builds order ready notification with sms placeholder channel", () => {
    const job = buildOrderReadyForPickupNotification({
      merchantId: "11111111-1111-1111-1111-111111111111",
      orderId: "22222222-2222-2222-2222-222222222222",
      orderReference: "ORD-1001",
      customerContact: "+233244123456",
    });

    expect(job.type).toBe(NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP);
    expect(job.channel).toBe("sms_placeholder");
    expect(job.recipient).toBe("+233244123456");
    expect(() =>
      validateNotificationPayload(job.type, job.payload),
    ).not.toThrow();
  });

  it("builds audit export completed notification", () => {
    const job = buildAuditExportCompletedNotification({
      merchantId: "11111111-1111-1111-1111-111111111111",
      exportJobId: "33333333-3333-3333-3333-333333333333",
      requestedByMerchantUserId: "44444444-4444-4444-4444-444444444444",
      recipientEmail: "manager@demo-cafe.test",
    });

    expect(job.type).toBe(NOTIFICATION_TYPES.AUDIT_EXPORT_COMPLETED);
    expect(job.channel).toBe("email_placeholder");
  });

  it("builds staff password reset notification", () => {
    const job = buildStaffPasswordResetNotification({
      merchantId: "11111111-1111-1111-1111-111111111111",
      merchantUserId: "55555555-5555-5555-5555-555555555555",
      email: "staff@demo-cafe.test",
    });

    expect(job.type).toBe(NOTIFICATION_TYPES.STAFF_PASSWORD_RESET);
    expect(() =>
      validateNotificationPayload(job.type, job.payload),
    ).not.toThrow();
  });

  it("rejects invalid order ready payload", () => {
    expect(() =>
      validateNotificationPayload(NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP, {
        orderId: "bad",
      }),
    ).toThrow();
  });
});
