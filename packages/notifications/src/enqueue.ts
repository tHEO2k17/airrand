import {
  AUDIT_ACTIONS,
  insertAuditLogSafe,
  notificationJobs,
  type AuditActorType,
  type Database,
} from "@airrand/database";
import {
  JOB_NAMES,
  notificationRequestedPayloadSchema,
  QUEUE_NAMES,
} from "@airrand/jobs";
import type { Queue } from "bullmq";
import { eq } from "drizzle-orm";
import type { NotificationJobInput } from "./builders.js";
import { validateNotificationPayload } from "./payloads.js";
import type { NotificationType } from "./types.js";

export type EnqueueNotificationAuditContext = {
  actorType: AuditActorType;
  actorLabel?: string | null;
  orderId?: string | null;
};

export type EnqueueNotificationJobInput = NotificationJobInput & {
  audit?: EnqueueNotificationAuditContext;
};

export async function enqueueNotificationJob(
  db: Database,
  queue: Queue,
  input: EnqueueNotificationJobInput,
): Promise<{ notificationJobId: string; jobId: string }> {
  validateNotificationPayload(input.type as NotificationType, input.payload);

  const [row] = await db
    .insert(notificationJobs)
    .values({
      merchantId: input.merchantId,
      type: input.type,
      channel: input.channel,
      recipient: input.recipient,
      payload: input.payload,
      status: "queued",
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create notification job");
  }

  const jobPayload = notificationRequestedPayloadSchema.parse({
    notificationJobId: row.id,
  });

  const job = await queue.add(JOB_NAMES.NOTIFICATION_REQUESTED, jobPayload);
  if (!job.id) {
    throw new Error("Failed to enqueue notification job");
  }

  await db
    .update(notificationJobs)
    .set({ bullJobId: job.id })
    .where(eq(notificationJobs.id, row.id));

  const audit = input.audit ?? {
    actorType: "system" as const,
    actorLabel: "notification",
  };

  await insertAuditLogSafe(db, {
    merchantId: input.merchantId,
    orderId: audit.orderId ?? null,
    actorType: audit.actorType,
    actorLabel: audit.actorLabel ?? null,
    action: AUDIT_ACTIONS.NOTIFICATION_QUEUED,
    metadata: {
      notificationJobId: row.id,
      type: input.type,
      channel: input.channel,
    },
  });

  return { notificationJobId: row.id, jobId: job.id };
}

export function getNotificationQueueName(): typeof QUEUE_NAMES.NOTIFICATION_REQUESTED {
  return QUEUE_NAMES.NOTIFICATION_REQUESTED;
}
