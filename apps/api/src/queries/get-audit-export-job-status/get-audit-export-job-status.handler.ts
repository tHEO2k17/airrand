import {
  auditExportJobResponseSchema,
  type AuditExportJobResponse,
} from "@airrand/contracts";
import { toAuditExportJobResponse } from "../../lib/audit-export.js";
import {
  auditExportJobsRepository,
  type AuditExportJobsRepository,
} from "../../repositories/audit-export-jobs.repository.js";
import type { GetAuditExportJobStatusQuery } from "./get-audit-export-job-status.query.js";

export type GetAuditExportJobStatusResult =
  | { kind: "not_found" }
  | { kind: "ok"; job: AuditExportJobResponse };

export type GetAuditExportJobStatusDeps = {
  auditExportJobsRepository: AuditExportJobsRepository;
};

export async function getAuditExportJobStatusHandler(
  query: GetAuditExportJobStatusQuery,
  deps: GetAuditExportJobStatusDeps = { auditExportJobsRepository },
): Promise<GetAuditExportJobStatusResult> {
  const job = await deps.auditExportJobsRepository.findByMerchantAndId(
    query.merchantId,
    query.exportJobId,
  );

  if (!job) {
    return { kind: "not_found" };
  }

  const response = auditExportJobResponseSchema.parse(
    toAuditExportJobResponse(job, query.merchantId),
  );

  return { kind: "ok", job: response };
}
