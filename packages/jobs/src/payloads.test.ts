import { describe, expect, it } from "vitest";
import {
  parseAuditExportRequestedPayload,
  parseNotificationPlaceholderPayload,
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

  it("parses notification placeholder payload", () => {
    const payload = parseNotificationPlaceholderPayload({
      merchantId: "11111111-1111-1111-1111-111111111111",
      channel: "placeholder",
      template: "staff.invited",
      metadata: { note: "future email hook" },
    });

    expect(payload.template).toBe("staff.invited");
  });

  it("rejects invalid notification placeholder channel", () => {
    expect(() =>
      parseNotificationPlaceholderPayload({
        merchantId: "11111111-1111-1111-1111-111111111111",
        channel: "email",
        template: "x",
      }),
    ).toThrow();
  });
});
