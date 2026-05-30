import { randomBytes } from "node:crypto";
import {
  createOrderSchema,
  createProductCategorySchema,
  createProductSchema,
  listOrdersQuerySchema,
  listProductsQuerySchema,
  auditExportJobResponseSchema,
  auditExportQueuedResponseSchema,
  auditExportRequestSchema,
  pickupVerifyRequestSchema,
  updateOrderStatusSchema,
  updateProductCategorySchema,
  updateProductSchema,
} from "@airrand/contracts";
import {
  assertCanTransitionOrderStatus,
  normalizeOrderReferenceQuery,
  type OrderStatus,
} from "@airrand/domain";
import { createPickupToken, PICKUP_TOKEN_TTL_MS, verifyPickupToken } from "@airrand/qr";
import {
  allocateOrderReference,
  AUDIT_ACTIONS,
  auditExportJobs,
  auditLogs,
  insertAuditLog,
  merchants,
  orderLines,
  orders,
  productCategories,
  products,
} from "@airrand/database";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db.js";
import {
  findMerchantById,
  findMerchantBySlug,
} from "../lib/merchant-lookup.js";
import { handleRouteError } from "../lib/errors.js";
import { toAuditLogResponse } from "../lib/audit.js";
import { toCustomerOrderStatusResponse } from "../lib/customer-order-status.js";
import {
  toMerchantResponse,
  toOrderResponse,
  toProductCategoryResponse,
  toProductResponse,
} from "../lib/mappers.js";
import {
  assertProductOrderable,
  findMerchantCategory,
  listProductsWithCategories,
} from "../lib/product-catalog.js";
import { assertPickupAllowed } from "../lib/pickup-verify.js";
import { getQrSigningSecret } from "../lib/qr.js";
import { Readable } from "node:stream";
import { enqueueAuditExportRequested } from "../lib/audit-export-queue.js";
import {
  buildOrderReadyForPickupNotification,
  enqueueOperationalNotificationBestEffort,
} from "../lib/notification-queue.js";
import { toAuditExportJobResponse } from "../lib/audit-export.js";
import {
  ExportDownloadError,
  getExportDownloadFilename,
  openCompletedExportReadStream,
} from "../lib/audit-export-download.js";
import { getMerchantActor, getMerchantAuth } from "../lib/merchant-auth.js";
import { jsonError, jsonOk } from "../lib/response.js";
import { requireMerchantAuth } from "../middleware/merchant-auth.js";
import { requireMerchantPermission } from "../middleware/merchant-permission.js";
import { requirePasswordChangeComplete } from "../middleware/require-password-change-complete.js";
import { staffRoutes } from "./staff.js";
import { eventsRoutes } from "./events.js";
import { merchantSettingsRoutes } from "./merchant-settings.js";
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
merchantsRoutes.route("/", merchantSettingsRoutes);

merchantsRoutes.get("/", async (c) => {
  try {
    const rows = await db.select().from(merchants).orderBy(asc(merchants.name));
    return jsonOk(c, { merchants: rows.map(toMerchantResponse) });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

merchantsRoutes.get("/by-slug/:slug", async (c) => {
  try {
    const merchant = await findMerchantBySlug(c.req.param("slug"));
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    return jsonOk(c, toMerchantResponse(merchant));
  } catch (error) {
    return handleRouteError(c, error);
  }
});

merchantsRoutes.get("/by-slug/:slug/products", async (c) => {
  try {
    const merchant = await findMerchantBySlug(c.req.param("slug"));
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    const query = listProductsQuerySchema.safeParse(c.req.query());
    if (!query.success) {
      return jsonError(c, "VALIDATION_ERROR", query.error.message, 400);
    }

    const rows = await listProductsWithCategories(
      merchant.id,
      query.data.availableOnly ?? false,
    );

    return jsonOk(c, {
      products: rows.map(({ product, category }) =>
        toProductResponse(product, category),
      ),
    });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

merchantsRoutes.get(
  "/by-slug/:slug/orders/by-reference/:reference/status",
  async (c) => {
    try {
      const merchant = await findMerchantBySlug(c.req.param("slug"));
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const reference = normalizeOrderReferenceQuery(c.req.param("reference"));

      const [order] = await db
        .select()
        .from(orders)
        .where(
          and(eq(orders.merchantId, merchant.id), eq(orders.reference, reference)),
        )
        .limit(1);

      if (!order) {
        return jsonError(c, "ORDER_NOT_FOUND", "Order not found", 404);
      }

      const lines = await db
        .select()
        .from(orderLines)
        .where(eq(orderLines.orderId, order.id));

      return jsonOk(c, toCustomerOrderStatusResponse(order, lines, merchant));
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.get(
  "/:merchantId/categories",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const rows = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.merchantId, merchantId))
        .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));

      return jsonOk(c, { categories: rows.map(toProductCategoryResponse) });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.post(
  "/:merchantId/categories",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("product:create"),
  zValidator("json", createProductCategorySchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const body = c.req.valid("json");
      const [category] = await db
        .insert(productCategories)
        .values({
          merchantId,
          name: body.name,
          iconKey: body.iconKey ?? null,
          sortOrder: body.sortOrder ?? 0,
          isActive: body.isActive ?? true,
        })
        .returning();

      if (!category) {
        return jsonError(c, "CREATE_FAILED", "Failed to create category", 500);
      }

      return jsonOk(c, toProductCategoryResponse(category), 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.patch(
  "/:merchantId/categories/:categoryId",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("product:update"),
  zValidator("json", updateProductCategorySchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const categoryId = c.req.param("categoryId");
      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const body = c.req.valid("json");
      const [category] = await db
        .update(productCategories)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productCategories.id, categoryId),
            eq(productCategories.merchantId, merchantId),
          ),
        )
        .returning();

      if (!category) {
        return jsonError(c, "CATEGORY_NOT_FOUND", "Category not found", 404);
      }

      return jsonOk(c, toProductCategoryResponse(category));
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

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

    const rows = await listProductsWithCategories(
      merchantId,
      query.data.availableOnly ?? false,
    );

    return jsonOk(c, {
      products: rows.map(({ product, category }) =>
        toProductResponse(product, category),
      ),
    });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

merchantsRoutes.post(
  "/:merchantId/products",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
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
      let category: Awaited<ReturnType<typeof findMerchantCategory>> = null;
      if (body.categoryId) {
        category = await findMerchantCategory(merchantId, body.categoryId);
        if (!category) {
          return jsonError(c, "CATEGORY_NOT_FOUND", "Category not found", 404);
        }
      }

      const [product] = await db
        .insert(products)
        .values({
          merchantId,
          categoryId: body.categoryId ?? null,
          name: body.name,
          description: body.description,
          unitPriceCents: body.unitPriceCents,
          isAvailable: body.isAvailable ?? true,
          stockState: body.stockState ?? "in_stock",
          stockQuantity: body.stockQuantity ?? null,
        })
        .returning();

      if (!product) {
        return jsonError(c, "CREATE_FAILED", "Failed to create product", 500);
      }

      void publishProductCreatedRealtime(merchantId, product, category).catch(
        (error) => {
          console.error("Realtime publish failed:", error);
        },
      );

      return jsonOk(c, toProductResponse(product, category), 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.patch(
  "/:merchantId/products/:productId",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
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
      if (body.categoryId) {
        const category = await findMerchantCategory(merchantId, body.categoryId);
        if (!category) {
          return jsonError(c, "CATEGORY_NOT_FOUND", "Category not found", 404);
        }
      }

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

      const category = product.categoryId
        ? await findMerchantCategory(merchantId, product.categoryId)
        : null;

      void publishProductUpdatedRealtime(merchantId, product, category).catch(
        (error) => {
          console.error("Realtime publish failed:", error);
        },
      );

      return jsonOk(c, toProductResponse(product, category));
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
      const catalogRows = await db
        .select({
          product: products,
          category: productCategories,
        })
        .from(products)
        .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
        .where(
          and(
            eq(products.merchantId, merchantId),
            inArray(products.id, productIds),
          ),
        );

      const catalogById = new Map(
        catalogRows.map((row) => [row.product.id, row]),
      );

      for (const line of body.lines) {
        const row = catalogById.get(line.productId);
        if (!row) {
          return jsonError(
            c,
            "PRODUCT_NOT_FOUND",
            `Product ${line.productId} not found for this merchant`,
            400,
          );
        }
        const orderable = assertProductOrderable(row.product, row.category);
        if (!orderable.ok) {
          return jsonError(c, "PRODUCT_UNAVAILABLE", orderable.message, 400);
        }
      }

      const issuedAt = Date.now();
      const expiresAt = issuedAt + PICKUP_TOKEN_TTL_MS;
      const nonce = randomBytes(16).toString("hex");

      const result = await db.transaction(async (tx) => {
        const reference = await allocateOrderReference(tx);
        const [order] = await tx
          .insert(orders)
          .values({
            reference,
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
          const { product } = catalogById.get(line.productId)!;
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
          actorLabel: body.customerName ?? body.customerContact ?? null,
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
  requirePasswordChangeComplete(),
  requireMerchantPermission("order:view"),
  async (c) => {
  try {
    const merchantId = c.req.param("merchantId");
    const merchant = await findMerchant(merchantId);
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    const query = listOrdersQuerySchema.safeParse(c.req.query());
    if (!query.success) {
      return jsonError(c, "VALIDATION_ERROR", query.error.message, 400);
    }

    const conditions = [eq(orders.merchantId, merchantId)];
    if (query.data.reference) {
      conditions.push(
        eq(orders.reference, normalizeOrderReferenceQuery(query.data.reference)),
      );
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(and(...conditions))
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

merchantsRoutes.get(
  "/:merchantId/orders/by-reference/:reference/status",
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const reference = normalizeOrderReferenceQuery(c.req.param("reference"));

      const merchant = await findMerchant(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(
          and(eq(orders.merchantId, merchantId), eq(orders.reference, reference)),
        )
        .limit(1);

      if (!order) {
        return jsonError(c, "ORDER_NOT_FOUND", "Order not found", 404);
      }

      const lines = await db
        .select()
        .from(orderLines)
        .where(eq(orderLines.orderId, order.id));

      return jsonOk(c, toCustomerOrderStatusResponse(order, lines, merchant));
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
  requirePasswordChangeComplete(),
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
  requirePasswordChangeComplete(),
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

        if (
          nextStatus === "ready" &&
          result.order.customerContact?.trim()
        ) {
          void enqueueOperationalNotificationBestEffort({
            ...buildOrderReadyForPickupNotification({
              merchantId,
              orderId: result.order.id,
              orderReference: result.order.reference,
              customerContact: result.order.customerContact,
            }),
            audit: {
              ...getMerchantActor(c),
              orderId: result.order.id,
            },
          });
        }
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
  requirePasswordChangeComplete(),
  requireMerchantPermission("audit_log:view"),
  async (c) => {
  try {
    const merchantId = c.req.param("merchantId");
    const merchant = await findMerchant(merchantId);
    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    const rows = await db
      .select({
        log: auditLogs,
        orderReference: orders.reference,
      })
      .from(auditLogs)
      .leftJoin(orders, eq(auditLogs.orderId, orders.id))
      .where(eq(auditLogs.merchantId, merchantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    return jsonOk(c, {
      auditLogs: rows.map((row) =>
        toAuditLogResponse(row.log, row.orderReference),
      ),
    });
  } catch (error) {
    return handleRouteError(c, error);
  }
  },
);

merchantsRoutes.post(
  "/:merchantId/audit-logs/export",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("audit_log:view"),
  zValidator("json", auditExportRequestSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const body = c.req.valid("json");
      const auth = getMerchantAuth(c)!;

      const [exportJob] = await db
        .insert(auditExportJobs)
        .values({
          merchantId,
          requestedByMerchantUserId: auth.merchantUserId,
          format: body.format,
          status: "queued",
        })
        .returning();

      if (!exportJob) {
        return jsonError(
          c,
          "INTERNAL_ERROR",
          "Failed to create export job",
          500,
        );
      }

      const { jobId: bullJobId } = await enqueueAuditExportRequested({
        exportJobId: exportJob.id,
        merchantId,
        requestedByMerchantUserId: auth.merchantUserId,
        format: body.format,
      });

      await db
        .update(auditExportJobs)
        .set({ bullJobId })
        .where(eq(auditExportJobs.id, exportJob.id));

      const response = auditExportQueuedResponseSchema.parse({
        exportJobId: exportJob.id,
        jobId: bullJobId,
        status: "queued",
      });

      return jsonOk(c, response);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("REDIS_URL is required")
      ) {
        return jsonError(
          c,
          "SERVICE_UNAVAILABLE",
          "Background job queue is not available",
          503,
        );
      }
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.get(
  "/:merchantId/audit-logs/exports/:exportJobId",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("audit_log:view"),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const exportJobId = c.req.param("exportJobId");

      const [job] = await db
        .select()
        .from(auditExportJobs)
        .where(
          and(
            eq(auditExportJobs.id, exportJobId),
            eq(auditExportJobs.merchantId, merchantId),
          ),
        )
        .limit(1);

      if (!job) {
        return jsonError(c, "EXPORT_NOT_FOUND", "Export job not found", 404);
      }

      const response = auditExportJobResponseSchema.parse(
        toAuditExportJobResponse(job, merchantId),
      );

      return jsonOk(c, response);
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantsRoutes.get(
  "/:merchantId/audit-logs/exports/:exportJobId/download",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantPermission("audit_log:view"),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const exportJobId = c.req.param("exportJobId");

      const [job] = await db
        .select()
        .from(auditExportJobs)
        .where(
          and(
            eq(auditExportJobs.id, exportJobId),
            eq(auditExportJobs.merchantId, merchantId),
          ),
        )
        .limit(1);

      if (!job) {
        return jsonError(c, "EXPORT_NOT_FOUND", "Export job not found", 404);
      }

      const readStream = await openCompletedExportReadStream(job);
      const webStream = Readable.toWeb(readStream) as ReadableStream;

      return c.newResponse(webStream, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${getExportDownloadFilename(exportJobId)}"`,
        },
      });
    } catch (error) {
      if (error instanceof ExportDownloadError) {
        return jsonError(
          c,
          error.code,
          error.message,
          error.status as 400 | 404 | 409,
        );
      }
      return handleRouteError(c, error);
    }
  },
);

async function findMerchant(merchantId: string) {
  return findMerchantById(merchantId);
}
