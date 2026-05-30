"use client";

import type { OrderResponse } from "@airrand/contracts";
import Link from "next/link";
import { Clock, User } from "lucide-react";
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
          <div
            key={order.id}
            className={`pos-order-card ${selected ? "is-selected" : ""}`}
          >
            <button
              type="button"
              className="pos-order-card__select"
              onClick={() => onSelect(order.id)}
            >
              <div className="pos-order-card__top">
                <span className="pos-order-card__id">
                  {order.reference}
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
            {order.status === "ready" ? (
              <Link href="/pickup" className="pos-order-card__pickup-link">
                Go to pickup
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
