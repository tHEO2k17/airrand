"use client";

import type { OrderResponse } from "@airrand/contracts";
import { StatTile } from "../ui/stat-tile";
import { Surface } from "../ui/surface";
import { StatusBadge } from "../ui/badge";
import { formatMoney } from "../../lib/format";
import { getOrderCatalogTotalCents, getOrderItemCount } from "../../lib/order-totals";

export function OrderSummaryCard({ order }: { order: OrderResponse | null }) {
  if (!order) {
    return (
      <Surface className="pos-summary-card">
        <h2 className="pos-section-title">Order summary</h2>
        <p className="pos-muted">Select an order to see catalog totals.</p>
      </Surface>
    );
  }

  const itemCount = getOrderItemCount(order);
  const catalogTotal = getOrderCatalogTotalCents(order);

  return (
    <Surface className="pos-summary-card">
      <h2 className="pos-section-title">Order summary</h2>
      <p className="pos-summary-disclaimer">
        Catalog totals for operational reference only — not a payment or checkout
        amount.
      </p>
      <div className="pos-summary-stats">
        <StatTile label="Items" value={itemCount} />
        <StatTile
          label="Estimated order value"
          value={formatMoney(catalogTotal)}
          hint="Sum of catalog line prices"
        />
        <div className="pos-summary-status">
          <span className="pos-muted">Status</span>
          <StatusBadge status={order.status} />
        </div>
      </div>
    </Surface>
  );
}
