"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerOrderStatusResponse } from "@airrand/contracts";
import { PickupQr } from "./pickup-qr";
import { CopyReference } from "./copy-reference";
import { ShareTrackingLink } from "./share-tracking-link";
import { OrderStatusTimeline } from "./order-status-timeline";
import { AlertMessage } from "./ui/alert-message";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { LoadingState } from "./ui/loading-state";
import { StatusBadge } from "./ui/badge";
import { Surface } from "./ui/surface";
import {
  ApiError,
  fetchOrderStatus,
  fetchOrderStatusByMerchantSlug,
} from "../lib/api";
import { formatDateTime } from "../lib/format";
import { readOrderConfirmation } from "../lib/order-confirmation";
import {
  buildOrderStatusTimeline,
  isTerminalOrderStatus,
} from "../lib/order-status-timeline";
import { buildStorePath } from "../lib/store-paths";
import { useOrderRealtime } from "../lib/use-order-realtime";
import type { OrderRealtimeConnectionStatus } from "../lib/use-order-realtime";

const CONNECTION_LABELS: Record<OrderRealtimeConnectionStatus, string> = {
  live: "Live updates",
  reconnecting: "Reconnecting…",
  polling: "Polling every 12 seconds",
};

function pickupInstructions(
  status: string,
  reference: string,
  merchantName: string,
): string {
  switch (status) {
    case "placed":
      return `${merchantName} received order ${reference} and will confirm it shortly.`;
    case "accepted":
      return `${merchantName} is preparing order ${reference}. Show your pickup code when it is ready.`;
    case "ready":
      return `Order ${reference} is ready at ${merchantName}. Show your pickup code at the counter.`;
    case "picked_up":
      return `Order ${reference} has been collected. Thanks for visiting ${merchantName}!`;
    case "cancelled":
      return `Order ${reference} was cancelled. Contact ${merchantName} if you have questions.`;
    default:
      return `Check back here for updates on order ${reference}.`;
  }
}

function showsPickupCode(status: string): boolean {
  return status === "accepted" || status === "ready";
}

export function OrderTrackingView({
  merchantSlug,
  reference,
}: {
  merchantSlug: string;
  reference: string;
}) {
  const [status, setStatus] = useState<CustomerOrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchOrderStatusByMerchantSlug(merchantSlug, reference);
      setStatus(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load order status");
      }
      setStatus(null);
    }
  }, [merchantSlug, reference]);

  useEffect(() => {
    setLoading(true);
    void loadStatus().finally(() => setLoading(false));
  }, [loadStatus]);

  const realtimeEnabled =
    status !== null && !isTerminalOrderStatus(status.status);

  const { connectionStatus } = useOrderRealtime({
    merchantId: status?.merchant.id ?? "",
    orderId: status?.id ?? "",
    enabled: realtimeEnabled,
    onStatus: (next) => setStatus(next),
    onPoll: async () => {
      if (!status?.merchant.id || !status.id) {
        await loadStatus();
        return;
      }
      try {
        const next = await fetchOrderStatus(status.merchant.id, status.id);
        setStatus(next);
      } catch {
        await loadStatus();
      }
    },
  });

  const timelineSteps = useMemo(
    () => buildOrderStatusTimeline(status?.status ?? "placed"),
    [status?.status],
  );

  const sessionConfirmation = readOrderConfirmation(merchantSlug);
  const pickupToken =
    status?.pickupToken ??
    (sessionConfirmation?.reference === reference
      ? sessionConfirmation.token
      : null);

  const storePath = buildStorePath(merchantSlug);

  if (loading && !status) {
    return <LoadingState label="Loading order status…" />;
  }

  if (error && !status) {
    return (
      <div className="store-page store-page--centered">
        <AlertMessage variant="error" message={error} />
        <Link href={storePath} style={{ display: "block", marginTop: "1rem" }}>
          <Button block variant="secondary">
            Back to menu
          </Button>
        </Link>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="store-page store-page--centered">
        <EmptyState
          title="Order not found"
          description="Check the reference and store link, then try again."
        />
        <Link href={storePath} style={{ display: "block", marginTop: "1rem" }}>
          <Button block variant="secondary">
            Back to menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="store-page store-page--centered">
      <header className="store-hero">
        <p className="store-total-hint">{status.merchant.name}</p>
        <h1>Order {status.reference}</h1>
        <p>Track your pickup without signing in.</p>
      </header>

      <Surface>
        <div className="store-status-header">
          <div>
            <p className="store-total-hint">Order reference</p>
            <p className="store-status-ref">{status.reference}</p>
          </div>
          <StatusBadge status={status.status} />
        </div>
        <div className="store-tracking-actions">
          <CopyReference reference={status.reference} />
          <ShareTrackingLink
            merchantSlug={merchantSlug}
            reference={status.reference}
          />
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
        <p>{pickupInstructions(status.status, status.reference, status.merchant.name)}</p>
        {status.pickupTokenExpiresAt ? (
          <p className="store-total-hint" style={{ marginTop: "0.75rem" }}>
            Pickup code valid until {formatDateTime(status.pickupTokenExpiresAt)}.
          </p>
        ) : null}
      </Surface>

      {showsPickupCode(status.status) && pickupToken ? (
        <Surface>
          <h2 className="store-section-title">Pickup code</h2>
          <p className="store-total-hint" style={{ marginBottom: "1rem" }}>
            Present this QR at the counter when collecting your order.
          </p>
          <div className="store-pickup-qr">
            <PickupQr token={pickupToken} />
          </div>
        </Surface>
      ) : null}

      {realtimeEnabled ? (
        <p className="store-total-hint store-polling-hint">
          {CONNECTION_LABELS[connectionStatus]}
        </p>
      ) : null}

      <Link href={storePath}>
        <Button block variant="secondary">
          Back to menu
        </Button>
      </Link>
    </div>
  );
}
