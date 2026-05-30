"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderResponse } from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { Alert } from "../components/alert";
import { LoadingState } from "../components/loading-state";
import { MerchantGate } from "../components/merchant-gate";
import { PageShell } from "../components/page-shell";
import { useMerchant } from "../components/merchant-context";
import { fetchOrders, fetchProducts } from "../lib/api";

const STATUS_KEYS: OrderStatus[] = [
  "placed",
  "accepted",
  "ready",
  "picked_up",
  "cancelled",
];

function DashboardContent() {
  const { merchantId } = useMerchant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [products, orderList] = await Promise.all([
        fetchProducts(merchantId),
        fetchOrders(merchantId),
      ]);
      setProductCount(products.length);
      setAvailableCount(products.filter((p) => p.isAvailable).length);
      setOrders(orderList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      STATUS_KEYS.map((s) => [s, 0]),
    ) as Record<OrderStatus, number>;
    for (const order of orders) {
      counts[order.status] += 1;
    }
    return counts;
  }, [orders]);

  return (
    <PageShell
      title="Dashboard"
      description="Overview of your demo store activity."
    >
      {error ? <Alert variant="error" message={error} /> : null}
      {loading ? <LoadingState /> : null}
      {!loading && !error ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Products</p>
              <p className="stat-value">{productCount}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Available</p>
              <p className="stat-value">{availableCount}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total orders</p>
              <p className="stat-value">{orders.length}</p>
            </div>
          </div>
          <div className="card">
            <h2>Orders by status</h2>
            <div className="stats-grid">
              {STATUS_KEYS.map((status) => (
                <div key={status} className="stat-card">
                  <p className="stat-label">{status.replace("_", " ")}</p>
                  <p className="stat-value">{statusCounts[status]}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

export default function DashboardPage() {
  return (
    <MerchantGate>
      <DashboardContent />
    </MerchantGate>
  );
}
