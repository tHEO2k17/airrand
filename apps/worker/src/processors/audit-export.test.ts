import { afterEach, describe, expect, it, vi } from "vitest";
import { processAuditExportRequested } from "./audit-export.js";
import * as logger from "../logger.js";

describe("processAuditExportRequested", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates payload and logs audit_export_requested", async () => {
    const spy = vi.spyOn(logger, "logWorkerEvent").mockImplementation(() => {});

    const result = await processAuditExportRequested({
      id: "job-123",
      data: {
        merchantId: "11111111-1111-1111-1111-111111111111",
        requestedByMerchantUserId: "22222222-2222-2222-2222-222222222222",
        requestedAt: "2026-01-01T12:00:00.000Z",
        format: "csv",
      },
    } as Parameters<typeof processAuditExportRequested>[0]);

    expect(result).toEqual({
      status: "placeholder",
      merchantId: "11111111-1111-1111-1111-111111111111",
    });

    const auditEvent = spy.mock.calls.find(
      ([, event]) =>
        typeof event === "object" &&
        event !== null &&
        "type" in event &&
        event.type === "audit_export_requested",
    );
    expect(auditEvent).toBeDefined();
  });

  it("rejects invalid payload", async () => {
    await expect(
      processAuditExportRequested({
        id: "job-1",
        data: { merchantId: "not-a-uuid" },
      } as Parameters<typeof processAuditExportRequested>[0]),
    ).rejects.toThrow();
  });
});
