import { enqueueNotificationJob } from "@airrand/notifications";
import { getRequiredRedisUrl, QUEUE_NAMES } from "@airrand/jobs";
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

export async function enqueueWorkerNotification(
  input: Parameters<typeof enqueueNotificationJob>[2],
): Promise<{ notificationJobId: string; jobId: string } | null> {
  try {
    return await enqueueNotificationJob(db, getNotificationQueue(), input);
  } catch (error) {
    console.error("Worker notification enqueue failed:", error);
    return null;
  }
}
