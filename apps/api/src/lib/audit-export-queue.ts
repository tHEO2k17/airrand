import {
  JOB_NAMES,
  QUEUE_NAMES,
  auditExportRequestedPayloadSchema,
  getRequiredRedisUrl,
} from "@airrand/jobs";
import { Queue } from "bullmq";

let auditExportQueue: Queue | null = null;

function getAuditExportQueue(): Queue {
  if (!auditExportQueue) {
    auditExportQueue = new Queue(QUEUE_NAMES.AUDIT_EXPORT_REQUESTED, {
      connection: {
        url: getRequiredRedisUrl(),
        maxRetriesPerRequest: null,
      },
    });
  }
  return auditExportQueue;
}

export type EnqueueAuditExportInput = {
  exportJobId: string;
  merchantId: string;
  requestedByMerchantUserId: string;
  format: "csv";
  requestedAt?: string;
};

export function buildAuditExportJobPayload(input: EnqueueAuditExportInput) {
  return auditExportRequestedPayloadSchema.parse({
    exportJobId: input.exportJobId,
    merchantId: input.merchantId,
    requestedByMerchantUserId: input.requestedByMerchantUserId,
    format: input.format,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
  });
}

export async function enqueueAuditExportRequested(
  input: EnqueueAuditExportInput,
): Promise<{ jobId: string }> {
  const payload = buildAuditExportJobPayload(input);
  const job = await getAuditExportQueue().add(
    JOB_NAMES.AUDIT_EXPORT_REQUESTED,
    payload,
  );
  if (!job.id) {
    throw new Error("Failed to enqueue audit export job");
  }
  return { jobId: job.id };
}

export function resetAuditExportQueueForTests(): void {
  auditExportQueue = null;
}
