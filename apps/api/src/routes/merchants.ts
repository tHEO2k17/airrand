import { randomBytes } from "node:crypto";
import {
  createOrderSchema,
  createProductSchema,
  listProductsQuerySchema,
  pickupVerifyRequestSchema,
  updateOrderStatusSchema,
  updateProductSchema,
} from "@airrand/contracts";
import {
  assertCanTransitionOrderStatus,
  type OrderStatus,
} from "@airrand/domain";
import { createPickupToken, PICKUP_TOKEN_TTL_MS, verifyPickupToken } from "@airrand/qr";
import {
  AUDIT_ACTIONS,
  auditLogs,
  insertAuditLog,
  merchants,
  orderLines,
  orders,
  products,
} from "@airrand/database";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db.js";
import { handleRouteError } from "../lib/errors.js";
import { toAuditLogResponse } from "../lib/audit.js";
import { toCustomerOrderStatusResponse } from "../lib/customer-order-status.js";
import {
  toMerchantResponse,
  toOrderResponse,
  toProductResponse,
} from "../lib/mappers.js";
import { assertPickupAllowed } from "../lib/pickup-verify.js";
import { getQrSigningSecret } from "../lib/qr.js";
import { getMerchantActor } from "../lib/merchant-auth.js";
import { jsonError, jsonOk } from "../lib/response.js";
import { requireMerchantAuth } from "../middleware/merchant-auth.js";
import { requireMerchantPermission } from "../middleware/merchant-permission.js";
import { staffRoutes } from "./staff.js";
import { eventsRoutes } from "./events.js";
import {
  publishOrderCreatedRealtime,
  publishOrderPickupVerifiedRealtime,
  publishOrderStatusChangedRealtime,
  publishProductCreatedRealtime,
  publishProductUpdatedRealtime,
} from "../lib/realtime/publish.js";

export const merchantsRoutes = new Hono();

merchantsRoutes.route("/", staffRoutes);
merchantsRoutes.route("/", eventsRoutes);

merchantsRoutes.get("/", async (c) => {
  try {
    const rows = await db.select().from(merchants).orderBy(asc(merchants.name));
    return jsonOk(c, { merchants: rows.map(toMerchantResponse) });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

merchantsRoutes.get("/:merchantId/products", async (c) => {
  try {
    const merchantId = c.req.param("merchantId");
    const merchant = await findMerchant(merchantId);
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    const query = listProductsQuerySchema.safeParse(c.req.query());
    if (!query.success) {
      return jsonError(c, "VALIDATION_ERROR", query.error.message, 400);
    }

    const conditions = [eq(products.merchantId, merchantId)];
    if (query.data.availableOnly) {
      conditions.push(eq(products.isAvailable, true));
    }

    const rows = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.name));

    return jsonOk(c, { products: rows.map(toProductResponse) });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

merchantsRoutes.post(
  "/:merchantId/products",
  requireMerchantAuth(),
  requireMerchantPermission("product:create"),
  zValidator("json", createProductSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const body = c.req.valid("json");
      const [product] = await db
        .insert(products)
        .values({
          merchantId,
          name: body.name,
          description: body.description,
          unitPriceCents: body.unitPriceCents,
          isAvailable: body.isAvailable ?? true,
        })
        .returning();

      if (!product) {
        return jsonError(c, "CREATE_FAILED", "Failed to create product", 500);
      }

      void publishProductCreatedRealtime(merchantId, product).catch((error) => {
        console.error("Realtime publish failed:", error);
      });

      return jsonOk(c, toProductResponse(product), 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.patch(
  "/:merchantId/products/:productId",
  requireMerchantAuth(),
  requireMerchantPermission("product:update"),
  zValidator("json", updateProductSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const productId = c.req.param("productId");
      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const body = c.req.valid("json");
      const [product] = await db
        .update(products)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(
          and(eq(products.id, productId), eq(products.merchantId, merchantId)),
        )
        .returning();

      if (!product) {
        return jsonError(c, "PRODUCT_NOT_FOUND", "Product not found", 404);
      }

      void publishProductUpdatedRealtime(merchantId, product).catch((error) => {
        console.error("Realtime publish failed:", error);
      });

      return jsonOk(c, toProductResponse(product));
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.post(
  "/:merchantId/orders",
  zValidator("json", createOrderSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const body = c.req.valid("json");
      const productIds = body.lines.map((line) => line.productId);
      const catalog = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.merchantId, merchantId),
            inArray(products.id, productIds),
          ),
        );

      const catalogById = new Map(catalog.map((p) => [p.id, p]));

      for (const line of body.lines) {
        const product = catalogById.get(line.productId);
        if (!product) {
          return jsonError(
            c,
            "PRODUCT_NOT_FOUND",
            `Product ${line.productId} not found for this merchant`,
            400,
          );
        }
        if (!product.isAvailable) {
          return jsonError(
            c,
            "PRODUCT_UNAVAILABLE",
            `Product "${product.name}" is not available`,
            400,
          );
        }
      }

      const issuedAt = Date.now();
      const expiresAt = issuedAt + PICKUP_TOKEN_TTL_MS;
      const nonce = randomBytes(16).toString("hex");

      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            merchantId,
            status: "placed",
            customerName: body.customerName,
            customerContact: body.customerContact,
            notes: body.notes,
            pickupTokenNonce: nonce,
            pickupTokenExpiresAt: new Date(expiresAt),
          })
          .returning();

        if (!order) {
          throw new Error("Failed to create order");
        }

        const lineValues = body.lines.map((line) => {
          const product = catalogById.get(line.productId)!;
          return {
            orderId: order.id,
            productId: product.id,
            quantity: line.quantity,
            productName: product.name,
            unitPriceCents: product.unitPriceCents,
          };
        });

        const insertedLines = await tx
          .insert(orderLines)
          .values(lineValues)
          .returning();

        await insertAuditLog(tx, {
          merchantId,
          orderId: order.id,
          actorType: "customer",
          actorLabel: body.customerName ?? null,
          action: AUDIT_ACTIONS.ORDER_CREATED,
          metadata: {
            lineCount: insertedLines.length,
            status: order.status,
          },
        });

        return { order, lines: insertedLines };
      });

      const { token } = createPickupToken({
        orderId: result.order.id,
        merchantId,
        secret: getQrSigningSecret(),
        nonce,
        issuedAt,
        expiresAt,
      });

      void publishOrderCreatedRealtime(merchant, result.order, result.lines).catch(
        (error) => {
          console.error("Realtime publish failed:", error);
        },
      );

      return jsonOk(
        c,
        {
          ...toOrderResponse(result.order, result.lines),
          pickup: {
            token,
            expiresAt: new Date(expiresAt).toISOString(),
          },
        },
        201,
      );
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.get(
  "/:merchantId/orders",
  requireMerchantAuth(),
  requireMerchantPermission("order:view"),
  async (c) => {
  try {
    const merchantId = c.req.param("merchantId");
    const merchant = await findMerchant(merchantId);
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.merchantId, merchantId))
      .orderBy(asc(orders.createdAt));

    const orderIds = orderRows.map((o) => o.id);
    const lines =
      orderIds.length === 0
        ? []
        : await db
            .select()
            .from(orderLines)
            .where(inArray(orderLines.orderId, orderIds));

    const linesByOrderId = new Map<string, typeof lines>();
    for (const line of lines) {
      const existing = linesByOrderId.get(line.orderId) ?? [];
      existing.push(line);
      linesByOrderId.set(line.orderId, existing);
    }

    return jsonOk(c, {
      orders: orderRows.map((order) =>
        toOrderResponse(order, linesByOrderId.get(order.id) ?? []),
      ),
    });
  } catch (error) {
    return handleRouteError(c, error);
  }
  },
);

merchantsRoutes.get("/:merchantId/orders/:orderId/status", async (c) => {
  try {
    const merchantId = c.req.param("merchantId");
    const orderId = c.req.param("orderId");

    const merchant = await findMerchant(merchantId);
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
      .limit(1);

    if (!order) {
      return jsonError(c, "ORDER_NOT_FOUND", "Order not found", 404);
    }

    const lines = await db
      .select()
      .from(orderLines)
      .where(eq(orderLines.orderId, orderId));

    return jsonOk(c, toCustomerOrderStatusResponse(order, lines, merchant));
  } catch (error) {
    return handleRouteError(c, error);
  }
});

merchantsRoutes.post(
  "/:merchantId/orders/:orderId/pickup/verify",
  requireMerchantAuth(),
  requireMerchantPermission("pickup:verify"),
  zValidator("json", pickupVerifyRequestSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const orderId = c.req.param("orderId");
      const { token } = c.req.valid("json");

      const payload = verifyPickupToken({
        token,
        secret: getQrSigningSecret(),
        expectedMerchantId: merchantId,
        expectedOrderId: orderId,
      });

      const [existing] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
        .limit(1);

      assertPickupAllowed(existing, payload);

      assertCanTransitionOrderStatus(existing!.status, "picked_up");

      const verifiedAt = new Date();
      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .update(orders)
          .set({
            status: "picked_up",
            pickedUpAt: verifiedAt,
            updatedAt: verifiedAt,
          })
          .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
          .returning();

        if (!order) {
          return null;
        }

        await insertAuditLog(tx, {
          merchantId,
          orderId: order.id,
          ...getMerchantActor(c),
          action: AUDIT_ACTIONS.ORDER_PICKUP_VERIFIED,
          metadata: {
            fromStatus: existing!.status,
            toStatus: "picked_up",
            verifiedAt: verifiedAt.toISOString(),
          },
        });

        const lines = await tx
          .select()
          .from(orderLines)
          .where(eq(orderLines.orderId, orderId));

        return { order, lines };
      });

      if (!result) {
        return jsonError(c, "ORDER_NOT_FOUND", "Order not found", 404);
      }

      const { order, lines } = result;

      const [merchantRow] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .limit(1);

      if (merchantRow) {
        void publishOrderPickupVerifiedRealtime(
          merchantRow,
          order,
          lines,
          verifiedAt.toISOString(),
        ).catch((error) => {
          console.error("Realtime publish failed:", error);
        });
      }

      return jsonOk(c, {
        order: toOrderResponse(order, lines),
        verifiedAt: verifiedAt.toISOString(),
      });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.patch(
  "/:merchantId/orders/:orderId/status",
  requireMerchantAuth(),
  requireMerchantPermission("order:update_status"),
  zValidator("json", updateOrderStatusSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const orderId = c.req.param("orderId");
      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const body = c.req.valid("json");
      const [existing] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
        .limit(1);

      if (!existing) {
        return jsonError(c, "ORDER_NOT_FOUND", "Order not found", 404);
      }

      const nextStatus = body.status as OrderStatus;
      if (existing.status !== nextStatus) {
        assertCanTransitionOrderStatus(existing.status, nextStatus);
      }

      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .update(orders)
          .set({ status: nextStatus, updatedAt: new Date() })
          .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
          .returning();

        if (!order) {
          return null;
        }

        if (existing.status !== nextStatus) {
          await insertAuditLog(tx, {
            merchantId,
            orderId: order.id,
            ...getMerchantActor(c),
            action: AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
            metadata: {
              fromStatus: existing.status,
              toStatus: nextStatus,
            },
          });
        }

        const lines = await tx
          .select()
          .from(orderLines)
          .where(eq(orderLines.orderId, orderId));

        return { order, lines };
      });

      if (!result) {
        return jsonError(c, "ORDER_NOT_FOUND", "Order not found", 404);
      }

      if (existing.status !== nextStatus) {
        void publishOrderStatusChangedRealtime(
          merchant,
          result.order,
          result.lines,
        ).catch((error) => {
          console.error("Realtime publish failed:", error);
        });
      }

      return jsonOk(c, toOrderResponse(result.order, result.lines));
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.get(
  "/:merchantId/audit-logs",
  requireMerchantAuth(),
  requireMerchantPermission("audit_log:view"),
  async (c) => {
  try {
    const merchantId = c.req.param("merchantId");
    const merchant = await findMerchant(merchantId);
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.merchantId, merchantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    return jsonOk(c, {
      auditLogs: rows.map(toAuditLogResponse),
    });
  } catch (error) {
    return handleRouteError(c, error);
  }
  },
);

async function findMerchant(merchantId: string) {
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);
  return merchant;
}
