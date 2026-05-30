/** Operational notification types — not marketing or payment messaging. */
export const NOTIFICATION_TYPES = {
  ORDER_READY_FOR_PICKUP: "order_ready_for_pickup",
  AUDIT_EXPORT_COMPLETED: "audit_export_completed",
  STAFF_PASSWORD_RESET: "staff_password_reset",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Provider-agnostic channels; placeholders until SMS/email integrations ship. */
export const NOTIFICATION_CHANNELS = {
  SMS_PLACEHOLDER: "sms_placeholder",
  EMAIL_PLACEHOLDER: "email_placeholder",
  INTERNAL: "internal",
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export const NOTIFICATION_JOB_STATUSES = {
  QUEUED: "queued",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
} as const;

export type NotificationJobStatus =
  (typeof NOTIFICATION_JOB_STATUSES)[keyof typeof NOTIFICATION_JOB_STATUSES];

export const PLACEHOLDER_PROVIDER_PREFIX = "placeholder";

export function buildPlaceholderProviderMessageId(
  channel: NotificationChannel,
  notificationJobId: string,
): string {
  return `${PLACEHOLDER_PROVIDER_PREFIX}:${channel}:${notificationJobId}`;
}
