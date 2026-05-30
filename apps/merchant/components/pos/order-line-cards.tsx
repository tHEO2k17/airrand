"use client";

import type { OrderResponse } from "@airrand/contracts";
import { User } from "lucide-react";
import { StatusBadge } from "../ui/badge";
import { Surface } from "../ui/surface";
import {
  getOrderActionHint,
  getOrderProgressPercent,
} from "../../lib/order-progress";
import { getOrderItemCount } from "../../lib/order-totals";

export function OrderLineCards({
  orders,
  selectedOrderId,
  onSelect,
}: {
  orders: OrderResponse[];
  selectedOrderId: string | null;
  onSelect: (orderId: string) => void;
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
        return (
          <button
            key={order.id}
            type="button"
            className={`pos-order-card ${selected ? "is-selected" : ""}`}
            onClick={() => onSelect(order.id)}
          >
            <div className="pos-order-card__top">
              <span className="pos-order-card__id">
                #{order.id.slice(0, 8)}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <p className="pos-order-card__customer">
              <User size={14} aria-hidden />
              {order.customerName ?? "Walk-in guest"}
            </p>
            <p className="pos-order-card__meta">
              {getOrderItemCount(order)} items · {getOrderActionHint(order.status)}
            </p>
            <div className="pos-order-card__progress" aria-hidden>
              <span
                className="pos-order-card__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
