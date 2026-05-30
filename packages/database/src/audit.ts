import type { AuditActorType } from "./schema/audit-logs.js";
import { auditLogs } from "./schema/audit-logs.js";
import type { Database } from "./client.js";

export const AUDIT_ACTIONS = {
  ORDER_CREATED: "order.created",
  ORDER_STATUS_CHANGED: "order.status_changed",
  ORDER_PICKUP_VERIFIED: "order.pickup_verified",
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
