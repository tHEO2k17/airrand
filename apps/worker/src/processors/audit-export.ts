import {
  JOB_NAMES,
  QUEUE_NAMES,
  parseAuditExportRequestedPayload,
} from "@airrand/jobs";
import type { Job } from "bullmq";
import { logWorkerEvent } from "../logger.js";

/**
 * Placeholder processor — export is not implemented in this phase.
 * Validates payload and logs structured output for future wiring.
 */
export async function processAuditExportRequested(
  job: Job,
): Promise<{ status: "placeholder"; merchantId: string }> {
  const startedAt = Date.now();
  const payload = parseAuditExportRequestedPayload(job.data);

  logWorkerEvent("info", {
    type: "job_started",
    queue: QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
    jobName: JOB_NAMES.AUDIT_EXPORT_REQUESTED,
    jobId: job.id,
    merchantId: payload.merchantId,
    format: payload.format,
  });

  logWorkerEvent("info", {
    type: "job_placeholder",
    queue: QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
    jobId: job.id,
    message:
      "Audit export is not implemented yet; job acknowledged without side effects.",
    merchantId: payload.merchantId,
    requestedByMerchantUserId: payload.requestedByMerchantUserId,
  });

  logWorkerEvent("info", {
    type: "job_completed",
    queue: QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
    jobName: JOB_NAMES.AUDIT_EXPORT_REQUESTED,
    jobId: job.id,
    durationMs: Date.now() - startedAt,
    merchantId: payload.merchantId,
  });

  return { status: "placeholder", merchantId: payload.merchantId };
}
