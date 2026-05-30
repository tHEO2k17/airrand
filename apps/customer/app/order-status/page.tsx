"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerOrderStatusResponse } from "@airrand/contracts";
import { AlertMessage } from "../../components/ui/alert-message";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { LoadingState } from "../../components/ui/loading-state";
import { StatusBadge } from "../../components/ui/badge";
import { Surface } from "../../components/ui/surface";
import { OrderStatusTimeline } from "../../components/order-status-timeline";
import { ApiError, fetchOrderStatus } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { readOrderConfirmation } from "../../lib/order-confirmation";
import {
  buildOrderStatusTimeline,
  isTerminalOrderStatus,
} from "../../lib/order-status-timeline";
import { useOrderRealtime } from "../../lib/use-order-realtime";
import type { OrderRealtimeConnectionStatus } from "../../lib/use-order-realtime";

const CONNECTION_LABELS: Record<OrderRealtimeConnectionStatus, string> = {
  live: "Live updates",
  reconnecting: "Reconnecting…",
  polling: "Polling every 12 seconds",
};

function pickupInstructions(status: string): string {
  switch (status) {
    case "placed":
      return "Your order was sent to the merchant. They will confirm it shortly.";
    case "accepted":
      return "The merchant is preparing your order.";
    case "ready":
      return "Your order is ready. Go to the counter and show your pickup code from the confirmation page.";
    case "picked_up":
      return "This order has been collected. Thanks for visiting!";
    case "cancelled":
      return "This order was cancelled. Contact the merchant if you have questions.";
    default:
      return "Check back here for updates on your pickup order.";
  }
}

export default function OrderStatusPage() {
  const [merchantId, setMerchantId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [lookupMerchantId, setLookupMerchantId] = useState("");
  const [lookupOrderId, setLookupOrderId] = useState("");
  const [status, setStatus] = useState<CustomerOrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readOrderConfirmation();
    if (stored) {
      setMerchantId(stored.merchantId);
      setOrderId(stored.orderId);
      setLookupMerchantId(stored.merchantId);
      setLookupOrderId(stored.orderId);
    }
    setHydrated(true);
  }, []);

  const activeMerchantId = lookupMerchantId.trim();
  const activeOrderId = lookupOrderId.trim();
  const canFetch = activeMerchantId.length > 0 && activeOrderId.length > 0;

  const loadStatus = useCallback(async () => {
    if (!canFetch) {
      return;
    }
    setError(null);
    try {
      const data = await fetchOrderStatus(activeMerchantId, activeOrderId);
      setStatus(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load order status");
      }
      setStatus(null);
    }
  }, [activeMerchantId, activeOrderId, canFetch]);

  useEffect(() => {
    if (!hydrated || !canFetch) {
      return;
    }
    setLoading(true);
    void loadStatus().finally(() => setLoading(false));
  }, [hydrated, canFetch, loadStatus]);

  const realtimeEnabled =
    canFetch && (status === null || !isTerminalOrderStatus(status.status));

  const { connectionStatus } = useOrderRealtime({
    merchantId: activeMerchantId,
    orderId: activeOrderId,
    enabled: realtimeEnabled,
    onStatus: (next) => setStatus(next),
    onPoll: () => loadStatus(),
  });

  const timelineSteps = useMemo(
    () => buildOrderStatusTimeline(status?.status ?? "placed"),
    [status?.status],
  );

  function handleLookup(event: FormEvent) {
    event.preventDefault();
    setLookupMerchantId(merchantId.trim());
    setLookupOrderId(orderId.trim());
  }

  if (!hydrated) {
    return <LoadingState label="Loading order status…" />;
  }

  return (
    <div className="store-page store-page--centered">
      <header className="store-hero">
        <h1>Order status</h1>
        <p>Track your pickup order without signing in.</p>
      </header>

      <Surface>
        <h2 className="store-section-title">Find your order</h2>
        <form className="store-form" onSubmit={handleLookup}>
          <label>
            <span>Merchant ID</span>
            <input
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder="Merchant UUID"
              autoComplete="off"
            />
          </label>
          <label>
            <span>Order ID</span>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order UUID"
              autoComplete="off"
            />
          </label>
          <Button type="submit" block disabled={!merchantId.trim() || !orderId.trim()}>
            Load status
          </Button>
        </form>
      </Surface>

      {error ? <AlertMessage variant="error" message={error} /> : null}

      {loading && !status ? <LoadingState label="Loading order status…" /> : null}

      {!loading && canFetch && !status && !error ? (
        <Surface>
          <EmptyState
            title="No status yet"
            description="Enter merchant and order IDs, then load status."
          />
        </Surface>
      ) : null}

      {status ? (
        <>
          <Surface>
            <div className="store-status-header">
              <div>
                <p className="store-total-hint">{status.merchant.name}</p>
                <h2 className="store-section-title" style={{ marginBottom: "0.35rem" }}>
                  Order <strong>{status.reference}</strong>
                </h2>
              </div>
              <StatusBadge status={status.status} />
            </div>
            <ul className="store-meta-list">
              <li>
                <strong>Placed:</strong> {formatDateTime(status.createdAt)}
              </li>
              <li>
                <strong>Last updated:</strong> {formatDateTime(status.updatedAt)}
              </li>
              {status.pickedUpAt ? (
                <li>
                  <strong>Picked up:</strong> {formatDateTime(status.pickedUpAt)}
                </li>
              ) : null}
            </ul>
          </Surface>

          <Surface>
            <h2 className="store-section-title">Progress</h2>
            {status.status === "cancelled" ? (
              <p className="store-total-hint" role="status">
                This order was cancelled.
              </p>
            ) : null}
            <OrderStatusTimeline steps={timelineSteps} />
          </Surface>

          <Surface>
            <h2 className="store-section-title">Items</h2>
            <ul className="store-line-list">
              {status.lines.map((line, index) => (
                <li key={`${line.productName}-${index}`}>
                  <span>{line.productName}</span>
                  <span>× {line.quantity}</span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface>
            <h2 className="store-section-title">Pickup instructions</h2>
            <p>{pickupInstructions(status.status)}</p>
            {status.status === "ready" && status.pickupTokenExpiresAt ? (
              <p className="store-total-hint" style={{ marginTop: "0.75rem" }}>
                Pickup code valid until {formatDateTime(status.pickupTokenExpiresAt)}.
                Open your confirmation page to show the QR code.
              </p>
            ) : null}
            <Link href="/order-confirmation" style={{ display: "block", marginTop: "1rem" }}>
              <Button block variant="secondary">
                View pickup code
              </Button>
            </Link>
          </Surface>

          {realtimeEnabled ? (
            <p className="store-total-hint store-polling-hint">
              {CONNECTION_LABELS[connectionStatus]}
            </p>
          ) : null}
        </>
      ) : null}

      <Link href="/">
        <Button block variant="secondary">
          Back to menu
        </Button>
      </Link>
    </div>
  );
}
