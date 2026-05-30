import type { AuditActorType } from "./schema/audit-logs.js";
import { auditLogs } from "./schema/audit-logs.js";
import type { Database } from "./client.js";

export const AUDIT_ACTIONS = {
  ORDER_CREATED: "order.created",
  ORDER_STATUS_CHANGED: "order.status_changed",
  ORDER_PICKUP_VERIFIED: "order.pickup_verified",
  STAFF_CREATED: "staff.created",
  STAFF_ROLE_UPDATED: "staff.role_updated",
  STAFF_DEACTIVATED: "staff.deactivated",
  STAFF_REACTIVATED: "staff.reactivated",
  STAFF_PASSWORD_RESET: "staff.password_reset",
  STAFF_PASSWORD_CHANGED: "staff.password_changed",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_ACCOUNT_LOCKED: "auth.account_locked",
  AUTH_PASSWORD_CHANGED: "auth.password_changed",
  AUTH_SESSION_REVOKED: "auth.session_revoked",
  NOTIFICATION_QUEUED: "notification.queued",
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_FAILED: "notification.failed",
} as const;

export type AuditTx = Pick<Database, "insert">;

export interface InsertAuditLogInput {
  merchantId: string;
  orderId?: string | null;
  actorType: AuditActorType;
  actorLabel?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}

export async function insertAuditLog(
  dbOrTx: AuditTx,
  input: InsertAuditLogInput,
): Promise<void> {
  await dbOrTx.insert(auditLogs).values({
    merchantId: input.merchantId,
    orderId: input.orderId ?? null,
    actorType: input.actorType,
    actorLabel: input.actorLabel ?? null,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}

/**
 * Best-effort audit write; logs error and does not throw.
 */
export async function insertAuditLogSafe(
  dbOrTx: AuditTx,
  input: InsertAuditLogInput,
): Promise<void> {
  try {
    await insertAuditLog(dbOrTx, input);
  } catch (error) {
    console.error("Audit log insert failed:", error);
  }
}
