/** BullMQ queue names (stable contract for producers and workers). */
export const QUEUE_NAMES = {
  AUDIT_EXPORT_REQUESTED: "audit.export.requested",
  NOTIFICATION_REQUESTED: "notification.requested",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const JOB_NAMES = {
  AUDIT_EXPORT_REQUESTED: "audit.export.requested",
  NOTIFICATION_REQUESTED: "notification.requested",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

/** Default job name equals queue name for each queue in this phase. */
export const DEFAULT_JOB_NAME_BY_QUEUE: Record<QueueName, JobName> = {
  [QUEUE_NAMES.AUDIT_EXPORT_REQUESTED]: JOB_NAMES.AUDIT_EXPORT_REQUESTED,
  [QUEUE_NAMES.NOTIFICATION_REQUESTED]: JOB_NAMES.NOTIFICATION_REQUESTED,
};

export function isKnownQueueName(value: string): value is QueueName {
  return (Object.values(QUEUE_NAMES) as string[]).includes(value);
}

export function queueNameForJob(jobName: string): QueueName | null {
  if (isKnownQueueName(jobName)) {
    return jobName;
  }
  return null;
}
