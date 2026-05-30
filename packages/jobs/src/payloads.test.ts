import { describe, expect, it } from "vitest";
import {
  parseAuditExportRequestedPayload,
  parseNotificationRequestedPayload,
} from "./payloads.js";

describe("job payloads", () => {
  it("parses audit export requested payload", () => {
    const payload = parseAuditExportRequestedPayload({
      exportJobId: "33333333-3333-3333-3333-333333333333",
      merchantId: "11111111-1111-1111-1111-111111111111",
      requestedByMerchantUserId: "22222222-2222-2222-2222-222222222222",
      requestedAt: "2026-01-01T12:00:00.000Z",
    });

    expect(payload.format).toBe("csv");
  });

  it("parses notification requested payload", () => {
    const payload = parseNotificationRequestedPayload({
      notificationJobId: "44444444-4444-4444-4444-444444444444",
    });

    expect(payload.notificationJobId).toBe(
      "44444444-4444-4444-4444-444444444444",
    );
  });

  it("rejects invalid notification requested payload", () => {
    expect(() =>
      parseNotificationRequestedPayload({
        notificationJobId: "not-a-uuid",
      }),
    ).toThrow();
  });
});
