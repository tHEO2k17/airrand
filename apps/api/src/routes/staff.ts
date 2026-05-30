import {
  createStaffRequestSchema,
  resetStaffPasswordRequestSchema,
  updateStaffRoleRequestSchema,
} from "@airrand/contracts";
import { hashPassword } from "@airrand/auth";
import {
  AUDIT_ACTIONS,
  insertAuditLogSafe,
  merchantUsers,
} from "@airrand/database";
import {
  canCreateStaffWithRole,
  canDeactivateMerchantUser,
  canReactivateMerchantUser,
  canResetStaffPassword,
  canUpdateStaffRole,
} from "@airrand/domain";
import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db.js";
import { handleRouteError } from "../lib/errors.js";
import { getMerchantActor, getMerchantAuth } from "../lib/merchant-auth.js";
import { jsonError, jsonOk } from "../lib/response.js";
import { toStaffMemberResponse } from "../lib/staff-mapper.js";
import { requireMerchantAuth } from "../middleware/merchant-auth.js";
import { requireMerchantPermission } from "../middleware/merchant-permission.js";
import { requirePasswordChangeComplete } from "../middleware/require-password-change-complete.js";

export const staffRoutes = new Hono();

staffRoutes.get(
  "/:merchantId/staff",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("staff:view"),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const rows = await db
        .select()
        .from(merchantUsers)
        .where(eq(merchantUsers.merchantId, merchantId))
        .orderBy(asc(merchantUsers.email));

      return jsonOk(c, {
        staff: rows.map(toStaffMemberResponse),
      });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

staffRoutes.post(
  "/:merchantId/staff",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("staff:create"),
  zValidator("json", createStaffRequestSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const body = c.req.valid("json");
      const auth = getMerchantAuth(c)!;

      if (!canCreateStaffWithRole(auth.role, body.role)) {
        return jsonError(
          c,
          "forbidden",
          "You do not have permission to create a user with this role.",
          403,
        );
      }

      const email = body.email.trim().toLowerCase();
      const [existing] = await db
        .select({ id: merchantUsers.id })
        .from(merchantUsers)
        .where(eq(merchantUsers.email, email))
        .limit(1);

      if (existing) {
        return jsonError(
          c,
          "EMAIL_IN_USE",
          "A user with this email already exists.",
          409,
        );
      }

      const now = new Date();
      const passwordHash = await hashPassword(body.temporaryPassword);

      const [created] = await db
        .insert(merchantUsers)
        .values({
          merchantId,
          email,
          displayName: body.displayName?.trim() ?? null,
          passwordHash,
          role: body.role,
          isActive: true,
          mustChangePassword: true,
          invitedAt: now,
          createdByMerchantUserId: auth.merchantUserId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!created) {
        return jsonError(c, "INTERNAL_ERROR", "Failed to create staff member", 500);
      }

      const actor = getMerchantActor(c);
      await insertAuditLogSafe(db, {
        merchantId,
        ...actor,
        action: AUDIT_ACTIONS.STAFF_CREATED,
        metadata: {
          merchantUserId: created.id,
          email: created.email,
          role: created.role,
        },
      });

      return jsonOk(c, { staff: toStaffMemberResponse(created) }, 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

staffRoutes.patch(
  "/:merchantId/staff/:merchantUserId/role",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("staff:update_role"),
  zValidator("json", updateStaffRoleRequestSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchantUserId = c.req.param("merchantUserId");
      const body = c.req.valid("json");
      const [target] = await db
        .select()
        .from(merchantUsers)
        .where(
          and(
            eq(merchantUsers.id, merchantUserId),
            eq(merchantUsers.merchantId, merchantId),
          ),
        )
        .limit(1);

      if (!target) {
        return jsonError(c, "NOT_FOUND", "Staff member not found", 404);
      }

      if (!target.isActive) {
        return jsonError(
          c,
          "ACCOUNT_INACTIVE",
          "Cannot update role for an inactive account.",
          400,
        );
      }

      const activeOwnerCount = await countActiveOwners(merchantId);
      const roleCheck = canUpdateStaffRole({
        targetRole: target.role,
        newRole: body.role,
        activeOwnerCount,
      });

      if (!roleCheck.allowed) {
        return jsonError(c, "forbidden", roleCheck.reason ?? "Not allowed", 403);
      }

      if (target.role === body.role) {
        return jsonOk(c, { staff: toStaffMemberResponse(target) });
      }

      const now = new Date();
      const [updated] = await db
        .update(merchantUsers)
        .set({ role: body.role, updatedAt: now })
        .where(eq(merchantUsers.id, target.id))
        .returning();

      if (!updated) {
        return jsonError(c, "INTERNAL_ERROR", "Failed to update staff role", 500);
      }

      const actor = getMerchantActor(c);
      await insertAuditLogSafe(db, {
        merchantId,
        ...actor,
        action: AUDIT_ACTIONS.STAFF_ROLE_UPDATED,
        metadata: {
          merchantUserId: updated.id,
          previousRole: target.role,
          newRole: updated.role,
        },
      });

      return jsonOk(c, { staff: toStaffMemberResponse(updated) });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

staffRoutes.post(
  "/:merchantId/staff/:merchantUserId/deactivate",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("staff:deactivate"),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchantUserId = c.req.param("merchantUserId");
      const auth = getMerchantAuth(c)!;

      const [target] = await db
        .select()
        .from(merchantUsers)
        .where(
          and(
            eq(merchantUsers.id, merchantUserId),
            eq(merchantUsers.merchantId, merchantId),
          ),
        )
        .limit(1);

      if (!target) {
        return jsonError(c, "NOT_FOUND", "Staff member not found", 404);
      }

      const activeOwnerCount = await countActiveOwners(merchantId);
      const deactivateCheck = canDeactivateMerchantUser({
        actorUserId: auth.merchantUserId,
        targetUserId: target.id,
        targetRole: target.role,
        targetIsActive: target.isActive,
        activeOwnerCount,
      });

      if (!deactivateCheck.allowed) {
        return jsonError(
          c,
          "forbidden",
          deactivateCheck.reason ?? "Not allowed",
          403,
        );
      }

      const now = new Date();
      const [updated] = await db
        .update(merchantUsers)
        .set({
          isActive: false,
          deactivatedAt: now,
          sessionVersion: sql`${merchantUsers.sessionVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(merchantUsers.id, target.id))
        .returning();

      if (!updated) {
        return jsonError(c, "INTERNAL_ERROR", "Failed to deactivate staff member", 500);
      }

      const actor = getMerchantActor(c);
      await insertAuditLogSafe(db, {
        merchantId,
        ...actor,
        action: AUDIT_ACTIONS.STAFF_DEACTIVATED,
        metadata: {
          merchantUserId: updated.id,
          email: updated.email,
          role: updated.role,
        },
      });
      await insertAuditLogSafe(db, {
        merchantId,
        ...actor,
        action: AUDIT_ACTIONS.AUTH_SESSION_REVOKED,
        metadata: {
          merchantUserId: updated.id,
          reason: "deactivated",
        },
      });

      return jsonOk(c, { staff: toStaffMemberResponse(updated) });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

staffRoutes.post(
  "/:merchantId/staff/:merchantUserId/reactivate",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("staff:reactivate"),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchantUserId = c.req.param("merchantUserId");

      const [target] = await db
        .select()
        .from(merchantUsers)
        .where(
          and(
            eq(merchantUsers.id, merchantUserId),
            eq(merchantUsers.merchantId, merchantId),
          ),
        )
        .limit(1);

      if (!target) {
        return jsonError(c, "NOT_FOUND", "Staff member not found", 404);
      }

      const reactivateCheck = canReactivateMerchantUser({
        targetIsActive: target.isActive,
      });

      if (!reactivateCheck.allowed) {
        return jsonError(
          c,
          "forbidden",
          reactivateCheck.reason ?? "Not allowed",
          403,
        );
      }

      const now = new Date();
      const [updated] = await db
        .update(merchantUsers)
        .set({
          isActive: true,
          deactivatedAt: null,
          updatedAt: now,
        })
        .where(eq(merchantUsers.id, target.id))
        .returning();

      if (!updated) {
        return jsonError(c, "INTERNAL_ERROR", "Failed to reactivate staff member", 500);
      }

      const actor = getMerchantActor(c);
      await insertAuditLogSafe(db, {
        merchantId,
        ...actor,
        action: AUDIT_ACTIONS.STAFF_REACTIVATED,
        metadata: {
          merchantUserId: updated.id,
          email: updated.email,
          role: updated.role,
        },
      });

      return jsonOk(c, { staff: toStaffMemberResponse(updated) });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

staffRoutes.post(
  "/:merchantId/staff/:merchantUserId/reset-password",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("staff:reset_password"),
  zValidator("json", resetStaffPasswordRequestSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchantUserId = c.req.param("merchantUserId");
      const body = c.req.valid("json");
      const auth = getMerchantAuth(c)!;

      const [target] = await db
        .select()
        .from(merchantUsers)
        .where(
          and(
            eq(merchantUsers.id, merchantUserId),
            eq(merchantUsers.merchantId, merchantId),
          ),
        )
        .limit(1);

      if (!target) {
        return jsonError(c, "NOT_FOUND", "Staff member not found", 404);
      }

      if (target.role === "owner") {
        return jsonError(
          c,
          "forbidden",
          "Owner passwords cannot be reset through staff management.",
          403,
        );
      }

      const resetCheck = canResetStaffPassword({
        actorUserId: auth.merchantUserId,
        targetUserId: target.id,
        targetIsActive: target.isActive,
      });

      if (!resetCheck.allowed) {
        return jsonError(c, "forbidden", resetCheck.reason ?? "Not allowed", 403);
      }

      const now = new Date();
      const passwordHash = await hashPassword(body.temporaryPassword);
      const [updated] = await db
        .update(merchantUsers)
        .set({
          passwordHash,
          mustChangePassword: true,
          sessionVersion: sql`${merchantUsers.sessionVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(merchantUsers.id, target.id))
        .returning();

      if (!updated) {
        return jsonError(c, "INTERNAL_ERROR", "Failed to reset password", 500);
      }

      const actor = getMerchantActor(c);
      await insertAuditLogSafe(db, {
        merchantId,
        ...actor,
        action: AUDIT_ACTIONS.STAFF_PASSWORD_RESET,
        metadata: {
          merchantUserId: updated.id,
          email: updated.email,
        },
      });
      await insertAuditLogSafe(db, {
        merchantId,
        ...actor,
        action: AUDIT_ACTIONS.AUTH_SESSION_REVOKED,
        metadata: {
          merchantUserId: updated.id,
          reason: "password_reset",
        },
      });

      return jsonOk(c, { staff: toStaffMemberResponse(updated) });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

async function countActiveOwners(merchantId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(merchantUsers)
    .where(
      and(
        eq(merchantUsers.merchantId, merchantId),
        eq(merchantUsers.role, "owner"),
        eq(merchantUsers.isActive, true),
      ),
    );

  return row?.count ?? 0;
}
