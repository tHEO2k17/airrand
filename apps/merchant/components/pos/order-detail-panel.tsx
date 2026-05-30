"use client";

import type { OrderResponse } from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { StatusBadge } from "../ui/badge";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Surface } from "../ui/surface";
import { formatDateTime, formatMoney } from "../../lib/format";
import { getAvailableOrderActions } from "../../lib/order-actions";
import { getOrderActionHint } from "../../lib/order-progress";

export function OrderDetailPanel({
  order,
  saving,
  onStatusChange,
}: {
  order: OrderResponse | null;
  saving: boolean;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  if (!order) {
    return (
      <Surface className="pos-order-detail">
        <EmptyState
          title="No order selected"
          description="Choose an order from the queue above to review lines and update fulfillment."
        />
      </Surface>
    );
  }

  const actions = getAvailableOrderActions(order);
  const showPickupLink = order.status === "ready";

  return (
    <Surface className="pos-order-detail">
      <div className="pos-order-detail__head">
        <div>
          <h2 className="pos-section-title">Current order</h2>
          <p className="pos-muted">#{order.id.slice(0, 8)} · {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <dl className="pos-detail-list">
        <div>
          <dt>Customer</dt>
          <dd>{order.customerName ?? "—"}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>{order.customerContact ?? "—"}</dd>
        </div>
        <div>
          <dt>Status note</dt>
          <dd>{getOrderActionHint(order.status)}</dd>
        </div>
      </dl>

      <h3 className="pos-subsection-title">Items</h3>
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

      {order.notes ? (
        <>
          <h3 className="pos-subsection-title">Notes</h3>
          <p className="pos-notes">{order.notes}</p>
        </>
      ) : null}

      <h3 className="pos-subsection-title">Update order</h3>
      <div className="pos-action-row">
        {actions.length === 0 ? (
          <p className="pos-muted">No status updates available.</p>
        ) : (
          actions.map((action) => (
            <Button
              key={action.status}
              variant={action.status === "cancelled" ? "danger" : "secondary"}
              size="sm"
              disabled={saving}
              onClick={() => onStatusChange(order.id, action.status)}
            >
              {action.label}
            </Button>
          ))
        )}
      </div>

      {showPickupLink ? (
        <Link href="/pickup" className="pos-pickup-link">
          <QrCode size={18} aria-hidden />
          Verify pickup on Pickup screen
        </Link>
      ) : null}
    </Surface>
  );
}
