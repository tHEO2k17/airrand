import {
  enqueueNotificationJob,
  type EnqueueNotificationAuditContext,
  type EnqueueNotificationJobInput,
} from "@airrand/notifications";
import { getRequiredRedisUrl, JOB_NAMES, QUEUE_NAMES } from "@airrand/jobs";
import { Queue } from "bullmq";
import { db } from "./db.js";

let notificationQueue: Queue | null = null;

function getNotificationQueue(): Queue {
  if (!notificationQueue) {
    notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION_REQUESTED, {
      connection: {
        url: getRequiredRedisUrl(),
        maxRetriesPerRequest: null,
      },
    });
  }
  return notificationQueue;
}

export async function enqueueOperationalNotification(
  input: EnqueueNotificationJobInput,
): Promise<{ notificationJobId: string; jobId: string }> {
  return enqueueNotificationJob(db, getNotificationQueue(), input);
}

export async function enqueueOperationalNotificationBestEffort(
  input: EnqueueNotificationJobInput,
): Promise<{ notificationJobId: string; jobId: string } | null> {
  try {
    return await enqueueOperationalNotification(input);
  } catch (error) {
    console.error("Notification enqueue failed:", error);
    return null;
  }
}

export {
  buildOrderReadyForPickupNotification,
  buildStaffPasswordResetNotification,
} from "@airrand/notifications";
export type { EnqueueNotificationAuditContext, EnqueueNotificationJobInput };

export function resetNotificationQueueForTests(): void {
  notificationQueue = null;
}

export function getNotificationJobNameForTests(): typeof JOB_NAMES.NOTIFICATION_REQUESTED {
  return JOB_NAMES.NOTIFICATION_REQUESTED;
}
