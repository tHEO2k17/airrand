import { describe, expect, it } from "vitest";
import { ExportDownloadError, resolveCompletedExportFilePath } from "./audit-export-download.js";
import type { AuditExportJob } from "@airrand/database";

describe("audit export download helper", () => {
  const completedJob = {
    id: "22222222-2222-2222-2222-222222222222",
    merchantId: "11111111-1111-1111-1111-111111111111",
    requestedByMerchantUserId: "33333333-3333-3333-3333-333333333333",
    bullJobId: "bull-1",
    status: "completed",
    format: "csv",
    filePath: "../../../etc/passwd",
    errorMessage: null,
    createdAt: new Date(),
    startedAt: new Date(),
    completedAt: new Date(),
  } satisfies AuditExportJob;

  it("rejects path traversal in stored file paths", async () => {
    await expect(resolveCompletedExportFilePath(completedJob)).rejects.toBeInstanceOf(
      ExportDownloadError,
    );
  });

  it("rejects downloads when export is not completed", async () => {
    await expect(
      resolveCompletedExportFilePath({
        ...completedJob,
        status: "processing",
        filePath: null,
      }),
    ).rejects.toMatchObject({
      code: "EXPORT_NOT_READY",
      status: 409,
    });
  });
});
