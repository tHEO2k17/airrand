import type { AuditExportJob } from "@airrand/database";
import type { AuditExportJobResponse } from "@airrand/contracts";

export function toAuditExportJobResponse(
  job: AuditExportJob,
  merchantId: string,
): AuditExportJobResponse {
  const downloadUrl =
    job.status === "completed"
      ? `/merchants/${merchantId}/audit-logs/exports/${job.id}/download`
      : null;

  return {
    exportJobId: job.id,
    merchantId: job.merchantId,
    status: job.status,
    format: job.format,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    downloadUrl,
    errorMessage: job.errorMessage ?? null,
  };
}
