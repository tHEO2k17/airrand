import {
  JOB_NAMES,
  QUEUE_NAMES,
  parseNotificationPlaceholderPayload,
} from "@airrand/jobs";
import type { Job } from "bullmq";
import { logWorkerEvent } from "../logger.js";

/**
 * Placeholder processor — no email or push providers in this phase.
 */
export async function processNotificationPlaceholder(
  job: Job,
): Promise<{ status: "placeholder"; template: string }> {
  const startedAt = Date.now();
  const payload = parseNotificationPlaceholderPayload(job.data);

  logWorkerEvent("info", {
    type: "job_started",
    queue: QUEUE_NAMES.NOTIFICATION_PLACEHOLDER,
    jobName: JOB_NAMES.NOTIFICATION_PLACEHOLDER,
    jobId: job.id,
    merchantId: payload.merchantId,
    template: payload.template,
  });

  logWorkerEvent("info", {
    type: "job_placeholder",
    queue: QUEUE_NAMES.NOTIFICATION_PLACEHOLDER,
    jobId: job.id,
    message:
      "Notification delivery is not implemented yet; job acknowledged without sending.",
    merchantId: payload.merchantId,
    template: payload.template,
    channel: payload.channel,
  });

  logWorkerEvent("info", {
    type: "job_completed",
    queue: QUEUE_NAMES.NOTIFICATION_PLACEHOLDER,
    jobName: JOB_NAMES.NOTIFICATION_PLACEHOLDER,
    jobId: job.id,
    durationMs: Date.now() - startedAt,
    merchantId: payload.merchantId,
  });

  return { status: "placeholder", template: payload.template };
}
