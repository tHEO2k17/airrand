import {
  AUDIT_ACTIONS,
  insertAuditLogSafe,
  notificationJobs,
  type NotificationJob,
} from "@airrand/database";
import {
  JOB_NAMES,
  parseNotificationRequestedPayload,
  QUEUE_NAMES,
} from "@airrand/jobs";
import {
  buildPlaceholderProviderMessageId,
  validateNotificationPayload,
  type NotificationType,
} from "@airrand/notifications";
import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { logWorkerEvent } from "../logger.js";
import { db } from "../lib/db.js";

const SAFE_FAILURE_MESSAGE = "Notification delivery failed";

function maskRecipient(recipient: string): string {
  if (recipient.length <= 4) {
    return "****";
  }
  return `${recipient.slice(0, 2)}***${recipient.slice(-2)}`;
}

export async function processNotificationRequested(
  job: Job,
): Promise<{ status: "sent" | "failed"; notificationJobId: string }> {
  const startedAt = Date.now();
  const payload = parseNotificationRequestedPayload(job.data);

  logWorkerEvent("info", {
    type: "job_started",
    queue: QUEUE_NAMES.NOTIFICATION_REQUESTED,
    jobName: JOB_NAMES.NOTIFICATION_REQUESTED,
    jobId: job.id,
    notificationJobId: payload.notificationJobId,
  });

  const [notificationJob] = await db
    .select()
    .from(notificationJobs)
    .where(eq(notificationJobs.id, payload.notificationJobId))
    .limit(1);

  if (!notificationJob) {
    throw new Error("Notification job not found");
  }

  await db
    .update(notificationJobs)
    .set({ status: "processing" })
    .where(eq(notificationJobs.id, notificationJob.id));

  try {
    validateNotificationPayload(
      notificationJob.type as NotificationType,
      notificationJob.payload,
    );

    logWorkerEvent("info", {
      type: "notification_dispatch_placeholder",
      queue: QUEUE_NAMES.NOTIFICATION_REQUESTED,
      jobId: job.id,
      notificationJobId: notificationJob.id,
      notificationType: notificationJob.type,
      channel: notificationJob.channel,
      recipientMasked: maskRecipient(notificationJob.recipient),
      merchantId: notificationJob.merchantId,
    });

    const providerMessageId = buildPlaceholderProviderMessageId(
      notificationJob.channel,
      notificationJob.id,
    );
    const sentAt = new Date();

    await db
      .update(notificationJobs)
      .set({
        status: "sent",
        providerMessageId,
        sentAt,
        errorMessage: null,
      })
      .where(eq(notificationJobs.id, notificationJob.id));

    await writeNotificationAudit(
      notificationJob,
      AUDIT_ACTIONS.NOTIFICATION_SENT,
      {
        notificationJobId: notificationJob.id,
        type: notificationJob.type,
        channel: notificationJob.channel,
        providerMessageId,
      },
    );

    logWorkerEvent("info", {
      type: "job_completed",
      queue: QUEUE_NAMES.NOTIFICATION_REQUESTED,
      jobName: JOB_NAMES.NOTIFICATION_REQUESTED,
      jobId: job.id,
      durationMs: Date.now() - startedAt,
      notificationJobId: notificationJob.id,
      notificationType: notificationJob.type,
    });

    return { status: "sent", notificationJobId: notificationJob.id };
  } catch (error) {
    await markNotificationFailed(notificationJob, error);
    throw error;
  }
}

async function markNotificationFailed(
  notificationJob: NotificationJob,
  error: unknown,
): Promise<void> {
  await db
    .update(notificationJobs)
    .set({
      status: "failed",
      errorMessage: SAFE_FAILURE_MESSAGE,
    })
    .where(eq(notificationJobs.id, notificationJob.id))
    .catch((updateError) => {
      logWorkerEvent("error", {
        type: "notification_status_update_failed",
        notificationJobId: notificationJob.id,
        message:
          updateError instanceof Error
            ? updateError.message
            : "Failed to mark notification as failed",
      });
    });

  await writeNotificationAudit(
    notificationJob,
    AUDIT_ACTIONS.NOTIFICATION_FAILED,
    {
      notificationJobId: notificationJob.id,
      type: notificationJob.type,
      channel: notificationJob.channel,
    },
  );

  logWorkerEvent("error", {
    type: "notification_failed",
    queue: QUEUE_NAMES.NOTIFICATION_REQUESTED,
    notificationJobId: notificationJob.id,
    merchantId: notificationJob.merchantId,
    message: error instanceof Error ? error.message : SAFE_FAILURE_MESSAGE,
  });
}

async function writeNotificationAudit(
  notificationJob: NotificationJob,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  if (!notificationJob.merchantId) {
    return;
  }

  const orderId =
    typeof notificationJob.payload.orderId === "string"
      ? notificationJob.payload.orderId
      : null;

  await insertAuditLogSafe(db, {
    merchantId: notificationJob.merchantId,
    orderId,
    actorType: "system",
    actorLabel: "notification",
    action,
    metadata,
  });
}
