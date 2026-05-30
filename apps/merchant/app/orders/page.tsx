"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderResponse } from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { NotificationFeedback } from "../../components/ui/notification-feedback";
import { NOTIFICATION_UI_COPY } from "@airrand/notifications/templates";
import { LoadingState } from "../../components/ui/loading-state";
import { Button } from "../../components/ui/button";
import { Surface } from "../../components/ui/surface";
import { StatusBadge } from "../../components/ui/badge";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { useAuth } from "../../components/auth-context";
import { useMerchant } from "../../components/merchant-context";
import { fetchOrders, updateOrderStatus } from "../../lib/api";
import { formatDateTime, formatMoney } from "../../lib/format";
import { PollingToolbar } from "../../components/polling-toolbar";
import { getAvailableOrderActions } from "../../lib/order-actions";
import {
  filterOrdersByStatus,
  ORDER_STATUS_FILTER_OPTIONS,
  type OrderStatusFilter,
} from "../../lib/orders-status-filter";
import { useMerchantRealtime } from "../../lib/use-merchant-realtime";

function OrdersContent() {
  const { merchantId } = useMerchant();
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notificationInfo, setNotificationInfo] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [referenceQuery, setReferenceQuery] = useState("");
  const [activeReferenceFilter, setActiveReferenceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");

  const filteredOrders = filterOrdersByStatus(orders, statusFilter);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!merchantId) {
      return;
    }
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const list = await fetchOrders(merchantId, {
        reference: activeReferenceFilter || undefined,
      });
      setOrders(
        [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      if (options?.silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [merchantId, activeReferenceFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const { connectionStatus } = useMerchantRealtime({
    merchantId,
    token,
    enabled: Boolean(merchantId) && !loading && !saving,
    onRefresh: () => load({ silent: true }),
  });

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!merchantId) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    setNotificationInfo(null);
    try {
      await updateOrderStatus(merchantId, orderId, status);
      setSuccess(`Order updated to ${status.replace("_", " ")}.`);
      setNotificationInfo(
        status === "ready" ? NOTIFICATION_UI_COPY.orderReadyQueued : null,
      );
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
      {error ? <NotificationFeedback kind="error" message={error} /> : null}
      {success ? <NotificationFeedback kind="actionSuccess" message={success} /> : null}
      {notificationInfo ? (
        <NotificationFeedback kind="notificationQueued" message={notificationInfo} />
      ) : null}

      <PollingToolbar
        lastUpdated={lastUpdated}
        onRefresh={() => void load({ silent: true })}
        refreshing={refreshing}
        connectionStatus={connectionStatus}
      />

      <Surface>
        <div className="pos-category-chips" role="tablist" aria-label="Filter by status">
          {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === option.value}
              className={`pos-category-chip${statusFilter === option.value ? " pos-category-chip--active" : ""}`}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Surface>

      <Surface>
        <form
          className="pos-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setActiveReferenceFilter(referenceQuery.trim());
          }}
        >
          <label className="pos-field">
            <span>Search by order reference</span>
            <input
              type="search"
              placeholder="ORD-1001 or 1001"
              value={referenceQuery}
              onChange={(event) => setReferenceQuery(event.target.value)}
            />
          </label>
          <div className="pos-form-actions">
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
            {activeReferenceFilter ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReferenceQuery("");
                  setActiveReferenceFilter("");
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </form>
      </Surface>

      <Surface>
        {loading ? <LoadingState /> : null}
        {!loading && orders.length === 0 ? (
          <p className="pos-muted">No orders yet.</p>
        ) : null}
        {!loading && orders.length > 0 && filteredOrders.length === 0 ? (
          <p className="pos-muted">No orders match this status filter.</p>
        ) : null}
        {!loading && filteredOrders.length > 0 ? (
          <div className="pos-table-wrap">
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
                {filteredOrders.map((order) => {
                  const actions = getAvailableOrderActions(order);
                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.reference}</strong>
                      </td>
                      <td>
                        {order.customerName ?? "—"}
                        {order.customerContact ? (
                          <p className="pos-muted">{order.customerContact}</p>
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
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <div className="pos-action-row">
                          {actions.length === 0 ? (
                            <span className="pos-muted">—</span>
                          ) : (
                            actions.map((action) => (
                              <Button
                                key={action.status}
                                variant={
                                  action.status === "cancelled"
                                    ? "danger"
                                    : "secondary"
                                }
                                size="sm"
                                disabled={saving}
                                onClick={() =>
                                  void handleStatusChange(order.id, action.status)
                                }
                              >
                                {action.label}
                              </Button>
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
      </Surface>
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
