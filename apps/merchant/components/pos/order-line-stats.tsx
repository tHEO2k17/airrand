"use client";

import type { OrderResponse } from "@airrand/contracts";
import { StatTile } from "../ui/stat-tile";
import { formatMoney } from "../../lib/format";
import { computePosDashboardStats } from "../../lib/pos-stats";

export function OrderLineStats({ orders }: { orders: OrderResponse[] }) {
  const stats = computePosDashboardStats(orders);

  return (
    <div className="pos-stats-row" aria-label="Order line summary">
      <StatTile
        label="Active orders"
        value={stats.activeOrders}
        hint="In progress"
      />
      <StatTile
        label="Ready for pickup"
        value={stats.readyForPickup}
        hint="Awaiting pickup"
      />
      <StatTile
        label="Today's orders"
        value={stats.todaysOrders}
        hint="Since midnight"
      />
      <StatTile
        label="Est. catalog value"
        value={formatMoney(stats.activeCatalogValueCents)}
        hint="Active orders only"
      />
    </div>
  );
}
