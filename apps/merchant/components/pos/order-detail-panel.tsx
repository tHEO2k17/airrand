"use client";

import type { OrderResponse } from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { Check, QrCode } from "lucide-react";
import { StatusBadge } from "../ui/badge";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Surface } from "../ui/surface";
import { formatDateTime, formatMoney } from "../../lib/format";
import { getAvailableOrderActions } from "../../lib/order-actions";
import { getOrderCatalogTotalCents, getOrderItemCount } from "../../lib/order-totals";

const FULFILLMENT_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "accepted", label: "Mark as accepted" },
  { status: "ready", label: "Mark as ready" },
];

function stepComplete(orderStatus: OrderStatus, stepStatus: OrderStatus): boolean {
  const rank: Record<OrderStatus, number> = {
    placed: 0,
    accepted: 1,
    ready: 2,
    picked_up: 3,
    cancelled: -1,
  };
  if (orderStatus === "cancelled") {
    return false;
  }
  return rank[orderStatus] >= rank[stepStatus];
}

export function OrderDetailPanel({
  order,
  saving,
  onStatusChange,
  onVerifyPickup,
}: {
  order: OrderResponse | null;
  saving: boolean;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onVerifyPickup?: (order: OrderResponse) => void;
}) {
  if (!order) {
    return (
      <Surface className="pos-order-detail" padding="lg">
        <EmptyState
          title="No order selected"
          description="Choose an order from the queue to review lines and update fulfillment."
        />
      </Surface>
    );
  }

  const cancelAction = getAvailableOrderActions(order).find(
    (a) => a.status === "cancelled",
  );
  const itemCount = getOrderItemCount(order);
  const catalogTotal = getOrderCatalogTotalCents(order);

  return (
    <Surface className="pos-order-detail" padding="lg">
      <div className="pos-order-detail__head">
        <div>
          <h2 className="pos-section-title">Current order</h2>
          <p className="pos-order-detail__id">
            {order.reference}
          </p>
          <p className="pos-muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <dl className="pos-detail-list">
        <div>
          <dt>Customer</dt>
          <dd>{order.customerName ?? "Walk-in guest"}</dd>
        </div>
        {order.customerContact ? (
          <div>
            <dt>Contact</dt>
            <dd>{order.customerContact}</dd>
          </div>
        ) : null}
      </dl>

      {order.notes ? (
        <>
          <h3 className="pos-subsection-title">Notes</h3>
          <p className="pos-notes">{order.notes}</p>
        </>
      ) : null}

      <h3 className="pos-subsection-title">Order items</h3>
      <ul className="pos-line-list">
        {order.lines.map((line) => (
          <li key={line.id}>
            <span>
              {line.quantity}× {line.productName}
            </span>
            <span>{formatMoney(line.unitPriceCents * line.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="pos-order-detail__totals">
        <div className="pos-order-detail__total-row">
          <span>Total items</span>
          <strong>{itemCount}</strong>
        </div>
        <div className="pos-order-detail__total-row pos-order-detail__total-row--highlight">
          <span>Estimated order value</span>
          <strong>{formatMoney(catalogTotal)}</strong>
        </div>
        <p className="pos-summary-disclaimer">
          Catalog total only. Payment is handled directly with the customer.
        </p>
      </div>

      <h3 className="pos-subsection-title">Order actions</h3>
      <ul className="pos-action-checklist">
        {FULFILLMENT_STEPS.map((step) => {
          const done = stepComplete(order.status, step.status);
          const canApply = getAvailableOrderActions(order).some(
            (a) => a.status === step.status,
          );
          return (
            <li key={step.status}>
              {done ? (
                <span className="pos-action-checklist__done">
                  <Check size={18} aria-hidden />
                  {step.label}
                </span>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="pos-btn--block"
                  disabled={saving || !canApply}
                  onClick={() => onStatusChange(order.id, step.status)}
                >
                  {step.label}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {cancelAction ? (
        <Button
          variant="danger"
          size="sm"
          className="pos-btn--block"
          disabled={saving}
          onClick={() => onStatusChange(order.id, "cancelled")}
        >
          Cancel order
        </Button>
      ) : null}

      {order.status === "ready" && onVerifyPickup ? (
        <button
          type="button"
          className="pos-verify-pickup-btn"
          disabled={saving}
          onClick={() => onVerifyPickup(order)}
        >
          <QrCode size={20} aria-hidden />
          Verify pickup
        </button>
      ) : null}
    </Surface>
  );
}
