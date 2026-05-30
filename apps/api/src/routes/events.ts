import { orders } from "@airrand/database";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../lib/db.js";
import { handleRouteError } from "../lib/errors.js";
import { jsonError } from "../lib/response.js";
import { merchantRealtimeChannel, orderRealtimeChannel } from "../lib/realtime/channels.js";
import { subscribeRealtimeEvents } from "../lib/realtime/event-bus.js";
import type { RealtimeEventMessage } from "../lib/realtime/types.js";
import { assertCustomerSafeRealtimePayload } from "../lib/realtime/sanitize.js";
import { requireMerchantAuth } from "../middleware/merchant-auth.js";
import { requireMerchantPermission } from "../middleware/merchant-permission.js";

const HEARTBEAT_MS = 28_000;

export const eventsRoutes = new Hono();

eventsRoutes.get(
  "/:merchantId/events",
  requireMerchantAuth(),
  requireMerchantPermission("order:view"),
  async (c) => {
    const merchantId = c.req.param("merchantId");

    return streamSSE(c, async (stream) => {
      const channel = merchantRealtimeChannel(merchantId);
      let closed = false;

      const unsubscribe = subscribeRealtimeEvents(channel, (message) => {
        if (closed) {
          return;
        }
        void stream.writeSSE({
          id: message.id,
          event: message.type,
          data: JSON.stringify(message),
        });
      });

      const heartbeat = setInterval(() => {
        if (closed) {
          return;
        }
        void stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ timestamp: new Date().toISOString() }),
        });
      }, HEARTBEAT_MS);

      stream.onAbort(() => {
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
      });

      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({ merchantId, timestamp: new Date().toISOString() }),
      });

      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
      });
    });
  },
);

eventsRoutes.get("/:merchantId/orders/:orderId/events", async (c) => {
  try {
    const merchantId = c.req.param("merchantId");
    const orderId = c.req.param("orderId");

    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
      .limit(1);

    if (!order) {
      return jsonError(c, "ORDER_NOT_FOUND", "Order not found", 404);
    }

    return streamSSE(c, async (stream) => {
      const channel = orderRealtimeChannel(merchantId, orderId);
      let closed = false;

      const unsubscribe = subscribeRealtimeEvents(channel, (message) => {
        if (closed) {
          return;
        }
        try {
          assertCustomerSafeRealtimePayload(
            message.data as Record<string, unknown>,
          );
        } catch {
          return;
        }

        void stream.writeSSE({
          id: message.id,
          event: message.type,
          data: JSON.stringify(toCustomerStreamPayload(message)),
        });
      });

      const heartbeat = setInterval(() => {
        if (closed) {
          return;
        }
        void stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ timestamp: new Date().toISOString() }),
        });
      }, HEARTBEAT_MS);

      stream.onAbort(() => {
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
      });

      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({
          merchantId,
          orderId,
          timestamp: new Date().toISOString(),
        }),
      });

      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
      });
    });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

function toCustomerStreamPayload(message: RealtimeEventMessage): {
  id: string;
  type: string;
  merchantId: string;
  orderId?: string;
  timestamp: string;
  data: unknown;
} {
  return {
    id: message.id,
    type: message.type,
    merchantId: message.merchantId,
    orderId: message.orderId,
    timestamp: message.timestamp,
    data: message.data,
  };
}
