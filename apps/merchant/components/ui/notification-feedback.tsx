import { AlertMessage, type AlertVariant } from "./alert-message";

/** Maps notification-related UI states to existing AlertMessage semantic variants. */
export type NotificationFeedbackKind =
  | "actionSuccess"
  | "notificationQueued"
  | "warning"
  | "error"
  | "info";

const variantByKind: Record<NotificationFeedbackKind, AlertVariant> = {
  actionSuccess: "success",
  notificationQueued: "info",
  warning: "warning",
  error: "error",
  info: "info",
};

export { variantByKind };

export function NotificationFeedback({
  kind,
  message,
}: {
  kind: NotificationFeedbackKind;
  message: string;
}) {
  return <AlertMessage variant={variantByKind[kind]} message={message} />;
}
