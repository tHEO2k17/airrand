import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAuditExportJobPayload,
  resetAuditExportQueueForTests,
} from "./audit-export-queue.js";

describe("audit export queue helper", () => {
  afterEach(() => {
    resetAuditExportQueueForTests();
    vi.unstubAllEnvs();
  });

  it("builds a validated job payload with defaults", () => {
    const payload = buildAuditExportJobPayload({
      merchantId: "11111111-1111-1111-1111-111111111111",
      requestedByMerchantUserId: "22222222-2222-2222-2222-222222222222",
      format: "csv",
      requestedAt: "2026-01-01T12:00:00.000Z",
    });

    expect(payload.format).toBe("csv");
    expect(payload.requestedAt).toBe("2026-01-01T12:00:00.000Z");
  });

  it("rejects invalid merchant ids", () => {
    expect(() =>
      buildAuditExportJobPayload({
        merchantId: "not-a-uuid",
        requestedByMerchantUserId: "22222222-2222-2222-2222-222222222222",
        format: "csv",
      }),
    ).toThrow();
  });
});
