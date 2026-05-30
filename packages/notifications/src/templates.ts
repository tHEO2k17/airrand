import type {
  AuditExportCompletedPayload,
  OrderReadyForPickupPayload,
  StaffPasswordResetPayload,
} from "./payloads.js";
import { NOTIFICATION_TYPES } from "./types.js";

/** In-app merchant UI copy — maps to AlertMessage semantic variants via NotificationFeedback. */
export const NOTIFICATION_UI_COPY = {
  orderReadyQueued: "Pickup notification queued.",
  exportCompleteQueued: "Export completion notification queued.",
  staffResetQueued: "Password reset notification queued.",
} as const;

/**
 * Placeholder SMS/email body copy for operational notifications.
 * Plain text only; no HTML, no marketing language, no payment wording.
 * Real providers should reuse these strings until templating moves to a CMS.
 */
export const NOTIFICATION_TEMPLATE_COPY = {
  [NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP]: (
    payload: OrderReadyForPickupPayload,
    merchantName?: string,
  ) => {
    const prefix = merchantName ? `${merchantName}: ` : "";
    return `${prefix}Order ${payload.orderReference} is ready for pickup. Show your pickup code at the counter.`;
  },
  [NOTIFICATION_TYPES.AUDIT_EXPORT_COMPLETED]: (
    payload: AuditExportCompletedPayload,
  ) =>
    `Your audit log export (${payload.exportJobId.slice(0, 8)}…) is ready. Download it from Audit log in the merchant dashboard.`,
  [NOTIFICATION_TYPES.STAFF_PASSWORD_RESET]: (
    payload: StaffPasswordResetPayload,
  ) =>
    `Your airRand staff password was reset for ${payload.email}. Sign in with the temporary password shared by your manager, then change it immediately.`,
} as const;

export type NotificationTemplateType = keyof typeof NOTIFICATION_TEMPLATE_COPY;

export function renderNotificationTemplate(
  type: NotificationTemplateType,
  payload: OrderReadyForPickupPayload | AuditExportCompletedPayload | StaffPasswordResetPayload,
  options?: { merchantName?: string },
): string {
  switch (type) {
    case NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP:
      return NOTIFICATION_TEMPLATE_COPY[NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP](
        payload as OrderReadyForPickupPayload,
        options?.merchantName,
      );
    case NOTIFICATION_TYPES.AUDIT_EXPORT_COMPLETED:
      return NOTIFICATION_TEMPLATE_COPY[NOTIFICATION_TYPES.AUDIT_EXPORT_COMPLETED](
        payload as AuditExportCompletedPayload,
      );
    case NOTIFICATION_TYPES.STAFF_PASSWORD_RESET:
      return NOTIFICATION_TEMPLATE_COPY[NOTIFICATION_TYPES.STAFF_PASSWORD_RESET](
        payload as StaffPasswordResetPayload,
      );
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
