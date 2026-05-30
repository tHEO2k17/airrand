"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderResponse } from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { Alert } from "../../components/alert";
import { LoadingState } from "../../components/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { StatusPill } from "../../components/status-pill";
import { useMerchant } from "../../components/merchant-context";
import { fetchOrders, updateOrderStatus } from "../../lib/api";
import { formatDateTime, formatMoney } from "../../lib/format";
import { getAvailableOrderActions } from "../../lib/order-actions";

function OrdersContent() {
  const { merchantId } = useMerchant();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchOrders(merchantId);
      setOrders(
        [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!merchantId) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateOrderStatus(merchantId, orderId, status);
      setSuccess(`Order updated to ${status.replace("_", " ")}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Orders"
      description="Review incoming orders and move them through fulfillment."
    >
      {error ? <Alert variant="error" message={error} /> : null}
      {success ? <Alert variant="success" message={success} /> : null}

      <div className="card">
        {loading ? <LoadingState /> : null}
        {!loading && orders.length === 0 ? (
          <p className="inline-muted">No orders yet.</p>
        ) : null}
        {!loading && orders.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Lines</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const actions = getAvailableOrderActions(order);
                  return (
                    <tr key={order.id}>
                      <td>
                        <code className="inline-muted">{order.id.slice(0, 8)}…</code>
                      </td>
                      <td>
                        {order.customerName ?? "—"}
                        {order.customerContact ? (
                          <p className="inline-muted">{order.customerContact}</p>
                        ) : null}
                      </td>
                      <td>
                        <ul className="order-lines">
                          {order.lines.map((line) => (
                            <li key={line.id}>
                              {line.quantity}× {line.productName} (
                              {formatMoney(line.unitPriceCents)})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <div className="btn-row">
                          {actions.length === 0 ? (
                            <span className="inline-muted">—</span>
                          ) : (
                            actions.map((action) => (
                              <button
                                key={action.status}
                                type="button"
                                className={
                                  action.status === "cancelled"
                                    ? "btn btn-danger"
                                    : "btn btn-secondary"
                                }
                                disabled={saving}
                                onClick={() =>
                                  void handleStatusChange(order.id, action.status)
                                }
                              >
                                {action.label}
                              </button>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

export default function OrdersPage() {
  return (
    <MerchantGate>
      <OrdersContent />
    </MerchantGate>
  );
}
