import type { AuditExportJob } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { getAuditExportJobStatusHandler } from "./get-audit-export-job-status.handler.js";
import type { AuditExportJobsRepository } from "../../repositories/audit-export-jobs.repository.js";

const merchantId = "11111111-1111-1111-1111-111111111111";
const exportJobId = "77777777-7777-7777-7777-777777777777";

function exportJob(overrides: Partial<AuditExportJob> = {}): AuditExportJob {
  return {
    id: exportJobId,
    merchantId,
    requestedByMerchantUserId: "88888888-8888-8888-8888-888888888888",
    format: "csv",
    status: "completed",
    bullJobId: "bull-1",
    objectKey: "exports/key.csv",
    errorMessage: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    startedAt: new Date("2026-01-01T00:01:00.000Z"),
    completedAt: new Date("2026-01-01T00:02:00.000Z"),
    ...overrides,
  };
}

describe("getAuditExportJobStatusHandler", () => {
  it("returns not_found when export job is missing", async () => {
    const auditExportJobsRepository: AuditExportJobsRepository = {
      findByMerchantAndId: vi.fn().mockResolvedValue(null),
    };

    const result = await getAuditExportJobStatusHandler(
      { merchantId, exportJobId },
      { auditExportJobsRepository },
    );

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns parsed export job response scoped to merchant", async () => {
    const auditExportJobsRepository: AuditExportJobsRepository = {
      findByMerchantAndId: vi.fn().mockResolvedValue(exportJob()),
    };

    const result = await getAuditExportJobStatusHandler(
      { merchantId, exportJobId },
      { auditExportJobsRepository },
    );

    expect(auditExportJobsRepository.findByMerchantAndId).toHaveBeenCalledWith(
      merchantId,
      exportJobId,
    );
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.job.exportJobId).toBe(exportJobId);
      expect(result.job.downloadUrl).toBe(
        `/merchants/${merchantId}/audit-logs/exports/${exportJobId}/download`,
      );
    }
  });
});
