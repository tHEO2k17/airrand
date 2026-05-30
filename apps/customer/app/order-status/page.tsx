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
import {
  ApiError,
  fetchOrderStatus,
  fetchOrderStatusByReference,
} from "../../lib/api";
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

function pickupInstructions(status: string, reference: string): string {
  switch (status) {
    case "placed":
      return `Order ${reference} was sent to the merchant. They will confirm it shortly.`;
    case "accepted":
      return `The merchant is preparing order ${reference}.`;
    case "ready":
      return `Order ${reference} is ready. Go to the counter and show your pickup code from the confirmation page.`;
    case "picked_up":
      return `Order ${reference} has been collected. Thanks for visiting!`;
    case "cancelled":
      return `Order ${reference} was cancelled. Contact the merchant if you have questions.`;
    default:
      return `Check back here for updates on order ${reference}.`;
  }
}

export default function OrderStatusPage() {
  const [merchantIdInput, setMerchantIdInput] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [lookupMerchantId, setLookupMerchantId] = useState("");
  const [lookupOrderId, setLookupOrderId] = useState("");
  const [status, setStatus] = useState<CustomerOrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readOrderConfirmation();
    if (stored) {
      setMerchantIdInput(stored.merchantId);
      setReferenceInput(stored.reference);
      setLookupMerchantId(stored.merchantId);
      setLookupOrderId(stored.orderId);
    }
    setHydrated(true);
  }, []);

  const canFetch = lookupMerchantId.length > 0 && lookupOrderId.length > 0;

  const loadStatus = useCallback(async () => {
    if (!canFetch) {
      return;
    }
    setError(null);
    try {
      const data = await fetchOrderStatus(lookupMerchantId, lookupOrderId);
      setStatus(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load order status");
      }
      setStatus(null);
    }
  }, [lookupMerchantId, lookupOrderId, canFetch]);

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
    merchantId: lookupMerchantId,
    orderId: lookupOrderId,
    enabled: realtimeEnabled,
    onStatus: (next) => {
      setStatus(next);
      setReferenceInput(next.reference);
      setLookupOrderId(next.id);
    },
    onPoll: () => loadStatus(),
  });

  const timelineSteps = useMemo(
    () => buildOrderStatusTimeline(status?.status ?? "placed"),
    [status?.status],
  );

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    const merchant = merchantIdInput.trim();
    const reference = referenceInput.trim();
    if (!merchant || !reference) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderStatusByReference(merchant, reference);
      setLookupMerchantId(merchant);
      setLookupOrderId(data.id);
      setStatus(data);
      setReferenceInput(data.reference);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load order status");
      }
      setStatus(null);
    } finally {
      setLoading(false);
    }
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
        <p className="store-total-hint" style={{ marginBottom: "1rem" }}>
          Use the order reference from your confirmation (for example{" "}
          <strong>ORD-1001</strong>). Merchant ID is only needed if you are
          looking up manually.
        </p>
        <form className="store-form" onSubmit={(event) => void handleLookup(event)}>
          <label>
            <span>Order reference</span>
            <input
              value={referenceInput}
              onChange={(e) => setReferenceInput(e.target.value)}
              placeholder="ORD-1001"
              autoComplete="off"
            />
          </label>
          <label>
            <span>Merchant ID</span>
            <input
              value={merchantIdInput}
              onChange={(e) => setMerchantIdInput(e.target.value)}
              placeholder="From your receipt (if required)"
              autoComplete="off"
            />
          </label>
          <Button
            type="submit"
            block
            disabled={!merchantIdInput.trim() || !referenceInput.trim()}
          >
            Load status
          </Button>
        </form>
      </Surface>

      {error ? <AlertMessage variant="error" message={error} /> : null}

      {loading && !status ? <LoadingState label="Loading order status…" /> : null}

      {!loading && status ? (
        <>
          <Surface>
            <div className="store-status-header">
              <div>
                <p className="store-total-hint">Order</p>
                <p className="store-status-ref">{status.reference}</p>
              </div>
              <StatusBadge status={status.status} />
            </div>
            <OrderStatusTimeline steps={timelineSteps} />
          </Surface>

          <Surface>
            <h2 className="store-section-title">Items</h2>
            <ul className="store-line-list">
              {status.lines.map((line) => (
                <li key={`${line.productName}-${line.quantity}`}>
                  <span>
                    {line.quantity}× {line.productName}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface>
            <h2 className="store-section-title">Pickup instructions</h2>
            <p>{pickupInstructions(status.status, status.reference)}</p>
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

      {!loading && !status && !error && canFetch ? (
        <EmptyState
          title="No status yet"
          description="We could not load status for this order."
        />
      ) : null}

      <Link href="/">
        <Button block variant="secondary">
          Back to menu
        </Button>
      </Link>
    </div>
  );
}
