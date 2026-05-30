import { afterEach, describe, expect, it, vi } from "vitest";
import { processAuditExportRequested } from "./audit-export.js";
import * as logger from "../logger.js";

vi.mock("../lib/db.js", () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

vi.mock("../lib/export-object-storage.js", () => ({
  uploadAuditExportCsv: vi.fn(() =>
    Promise.resolve(
      "audit-exports/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.csv",
    ),
  ),
}));

describe("processAuditExportRequested", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid payload", async () => {
    await expect(
      processAuditExportRequested({
        id: "job-1",
        data: { merchantId: "not-a-uuid" },
      } as Parameters<typeof processAuditExportRequested>[0]),
    ).rejects.toThrow();
  });

  it("marks export failed when upload throws", async () => {
    const { uploadAuditExportCsv } = await import("../lib/export-object-storage.js");
    vi.mocked(uploadAuditExportCsv).mockRejectedValueOnce(new Error("storage unavailable"));

    const spy = vi.spyOn(logger, "logWorkerEvent").mockImplementation(() => {});

    await expect(
      processAuditExportRequested({
        id: "job-123",
        data: {
          exportJobId: "22222222-2222-2222-2222-222222222222",
          merchantId: "11111111-1111-1111-1111-111111111111",
          requestedByMerchantUserId: "33333333-3333-3333-3333-333333333333",
          requestedAt: "2026-01-01T12:00:00.000Z",
          format: "csv",
        },
      } as Parameters<typeof processAuditExportRequested>[0]),
    ).rejects.toThrow("storage unavailable");

    const failedEvent = spy.mock.calls.find(
      ([, event]) =>
        typeof event === "object" &&
        event !== null &&
        "type" in event &&
        event.type === "audit_export_failed",
    );
    expect(failedEvent).toBeDefined();
  });
});
