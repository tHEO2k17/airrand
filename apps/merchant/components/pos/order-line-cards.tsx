"use client";

import type { OrderResponse } from "@airrand/contracts";
import { Clock, QrCode, User } from "lucide-react";
import { StatusBadge } from "../ui/badge";
import { Surface } from "../ui/surface";
import { formatDateTime } from "../../lib/format";
import {
  getOrderActionHint,
  getOrderProgressPercent,
} from "../../lib/order-progress";
import { getOrderItemCount } from "../../lib/order-totals";

export function OrderLineCards({
  orders,
  selectedOrderId,
  onSelect,
  onVerifyPickup,
  isOrderUnread,
  isOrderNew,
}: {
  orders: OrderResponse[];
  selectedOrderId: string | null;
  onSelect: (orderId: string) => void;
  onVerifyPickup?: (order: OrderResponse) => void;
  isOrderUnread?: (orderId: string) => boolean;
  isOrderNew?: (order: OrderResponse) => boolean;
}) {
  if (orders.length === 0) {
    return (
      <Surface padding="md" className="pos-order-line-empty">
        <p className="pos-muted">No active orders in the queue.</p>
      </Surface>
    );
  }

  return (
    <div className="pos-order-line">
      {orders.map((order) => {
        const progress = getOrderProgressPercent(order.status);
        const selected = order.id === selectedOrderId;
        const unread = isOrderUnread?.(order.id) ?? false;
        const isNew = isOrderNew?.(order) ?? false;
        return (
          <div
            key={order.id}
            className={[
              "pos-order-card",
              selected ? "is-selected" : "",
              unread ? "pos-order-card--unread" : "",
              isNew ? "pos-order-card--new" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <button
              type="button"
              className="pos-order-card__select"
              onClick={() => onSelect(order.id)}
            >
              <div className="pos-order-card__top">
                <span className="pos-order-card__id">
                  {order.reference}
                  {isNew ? <span className="pos-order-card__new-badge">New</span> : null}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <p className="pos-order-card__customer">
                <User size={14} aria-hidden />
                {order.customerName ?? "Walk-in guest"}
              </p>
              <p className="pos-order-card__meta">
                {getOrderItemCount(order)} items ·{" "}
                {getOrderActionHint(order.status)}
              </p>
              <p className="pos-order-card__time">
                <Clock size={12} aria-hidden />
                {formatDateTime(order.createdAt)}
              </p>
              <div className="pos-order-card__progress" aria-hidden>
                <span
                  className="pos-order-card__progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </button>
            {order.status === "ready" && onVerifyPickup ? (
              <button
                type="button"
                className="pos-order-card__pickup-link"
                onClick={(event) => {
                  event.stopPropagation();
                  onVerifyPickup(order);
                }}
              >
                <QrCode size={14} aria-hidden />
                Verify pickup
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
