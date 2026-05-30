import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  type NotificationChannel,
} from "./types.js";
import type {
  AuditExportCompletedPayload,
  OrderReadyForPickupPayload,
  StaffPasswordResetPayload,
} from "./payloads.js";
import {
  auditExportCompletedPayloadSchema,
  orderReadyForPickupPayloadSchema,
  staffPasswordResetPayloadSchema,
} from "./payloads.js";

export type NotificationJobInput = {
  merchantId: string;
  type: (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
  channel: NotificationChannel;
  recipient: string;
  payload: Record<string, unknown>;
};

export function buildOrderReadyForPickupNotification(input: {
  merchantId: string;
  orderId: string;
  orderReference: string;
  customerContact: string;
}): NotificationJobInput {
  const payload: OrderReadyForPickupPayload =
    orderReadyForPickupPayloadSchema.parse({
      merchantId: input.merchantId,
      orderId: input.orderId,
      orderReference: input.orderReference,
    });

  return {
    merchantId: input.merchantId,
    type: NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP,
    channel: NOTIFICATION_CHANNELS.SMS_PLACEHOLDER,
    recipient: input.customerContact.trim(),
    payload,
  };
}

export function buildAuditExportCompletedNotification(input: {
  merchantId: string;
  exportJobId: string;
  requestedByMerchantUserId: string;
  recipientEmail: string;
}): NotificationJobInput {
  const payload: AuditExportCompletedPayload =
    auditExportCompletedPayloadSchema.parse({
      merchantId: input.merchantId,
      exportJobId: input.exportJobId,
      requestedByMerchantUserId: input.requestedByMerchantUserId,
    });

  return {
    merchantId: input.merchantId,
    type: NOTIFICATION_TYPES.AUDIT_EXPORT_COMPLETED,
    channel: NOTIFICATION_CHANNELS.EMAIL_PLACEHOLDER,
    recipient: input.recipientEmail.trim(),
    payload,
  };
}

export function buildStaffPasswordResetNotification(input: {
  merchantId: string;
  merchantUserId: string;
  email: string;
}): NotificationJobInput {
  const payload: StaffPasswordResetPayload =
    staffPasswordResetPayloadSchema.parse({
      merchantId: input.merchantId,
      merchantUserId: input.merchantUserId,
      email: input.email,
    });

  return {
    merchantId: input.merchantId,
    type: NOTIFICATION_TYPES.STAFF_PASSWORD_RESET,
    channel: NOTIFICATION_CHANNELS.EMAIL_PLACEHOLDER,
    recipient: input.email.trim(),
    payload,
  };
}
