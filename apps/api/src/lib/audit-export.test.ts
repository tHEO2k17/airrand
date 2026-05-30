import { describe, expect, it } from "vitest";
import type { AuditExportJob } from "@airrand/database";
import { toAuditExportJobResponse } from "./audit-export.js";

describe("toAuditExportJobResponse", () => {
  const baseJob = {
    id: "22222222-2222-2222-2222-222222222222",
    merchantId: "11111111-1111-1111-1111-111111111111",
    requestedByMerchantUserId: "33333333-3333-3333-3333-333333333333",
    bullJobId: "bull-1",
    format: "csv",
    filePath: null,
    errorMessage: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
    startedAt: null,
    completedAt: null,
  } satisfies Omit<AuditExportJob, "status">;

  it("includes download URL when completed", () => {
    const response = toAuditExportJobResponse(
      {
        ...baseJob,
        status: "completed",
        filePath: "11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.csv",
        completedAt: new Date("2026-01-01T12:05:00.000Z"),
      },
      baseJob.merchantId,
    );

    expect(response.downloadUrl).toBe(
      "/merchants/11111111-1111-1111-1111-111111111111/audit-logs/exports/22222222-2222-2222-2222-222222222222/download",
    );
  });

  it("omits download URL while processing", () => {
    const response = toAuditExportJobResponse(
      { ...baseJob, status: "processing" },
      baseJob.merchantId,
    );

    expect(response.downloadUrl).toBeNull();
  });
});
