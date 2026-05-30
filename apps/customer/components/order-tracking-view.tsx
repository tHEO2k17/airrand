"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerOrderStatusResponse } from "@airrand/contracts";
import { PickupQr } from "./pickup-qr";
import { PickupQrLockedPlaceholder } from "./pickup-qr-locked";
import { CopyReference } from "./copy-reference";
import { CopyTrackingLink } from "./copy-tracking-link";
import { ShareTrackingLink } from "./share-tracking-link";
import { OrderStatusTimeline } from "./order-status-timeline";
import { AlertMessage } from "./ui/alert-message";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { LoadingState } from "./ui/loading-state";
import { StatusBadge } from "./ui/badge";
import { Surface } from "./ui/surface";
import {
  fetchOrderStatus,
  fetchOrderStatusByMerchantSlug,
} from "../lib/api";
import { toCustomerErrorMessage } from "../lib/customer-error-message";
import { formatDateTime } from "../lib/format";
import { readOrderConfirmation } from "../lib/order-confirmation";
import {
  buildOrderStatusTimeline,
  isTerminalOrderStatus,
} from "../lib/order-status-timeline";
import {
  shouldShowPickupQr,
  shouldShowPickupQrLocked,
} from "../lib/pickup-qr-eligibility";
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
      return `${merchantName} is preparing order ${reference}. Your pickup code will unlock when the order is ready.`;
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
      setError(
        toCustomerErrorMessage(
          err,
          "We could not find that order. Check the shop link and order reference.",
        ),
      );
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
        <Link href="/" style={{ display: "block", marginTop: "1rem" }}>
          <Button block variant="secondary">
            Browse products
          </Button>
        </Link>
        <Link href={storePath} style={{ display: "block", marginTop: "0.75rem" }}>
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
          description="We could not find that order. Check the shop link and order reference."
        />
        <Link href="/" style={{ display: "block", marginTop: "1rem" }}>
          <Button block variant="secondary">
            Browse products
          </Button>
        </Link>
      </div>
    );
  }

  const isReady = status.status === "ready";
  const isPickedUp = status.status === "picked_up";
  const showQr = shouldShowPickupQr(status.status) && pickupToken;
  const showLocked = shouldShowPickupQrLocked(status.status);

  return (
    <div className="store-page store-page--centered store-page--tracking">
      <header className="store-hero store-hero--compact">
        <p className="store-total-hint">{status.merchant.name}</p>
        <h1>Order {status.reference}</h1>
        <p>Track your pickup without signing in.</p>
      </header>

      {isReady ? (
        <div className="store-tracking-callout store-tracking-callout--ready" role="status">
          <p className="store-tracking-callout__title">Ready for pickup</p>
          <p className="store-tracking-callout__desc">
            Head to {status.merchant.name} and show your pickup code at the counter.
          </p>
        </div>
      ) : null}

      {isPickedUp ? (
        <div className="store-tracking-callout store-tracking-callout--success" role="status">
          <p className="store-tracking-callout__title">Order collected</p>
          <p className="store-tracking-callout__desc">
            Thanks for shopping with {status.merchant.name}. This order is handled by the shop.
          </p>
        </div>
      ) : null}

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
          <CopyTrackingLink
            merchantSlug={merchantSlug}
            reference={status.reference}
          />
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
        {status.pickupTokenExpiresAt && isReady ? (
          <p className="store-total-hint" style={{ marginTop: "0.75rem" }}>
            Pickup code valid until {formatDateTime(status.pickupTokenExpiresAt)}.
          </p>
        ) : null}
      </Surface>

      {showLocked ? (
        <Surface>
          <h2 className="store-section-title">Pickup code</h2>
          <PickupQrLockedPlaceholder />
        </Surface>
      ) : null}

      {showQr ? (
        <Surface className="store-pickup-code-surface">
          <h2 className="store-section-title">Pickup code</h2>
          <p className="store-total-hint" style={{ marginBottom: "1rem" }}>
            Present this QR at the counter when collecting your order.
          </p>
          <div className="store-pickup-qr">
            <PickupQr token={pickupToken} />
          </div>
          {isReady ? (
            <Link href={storePath} style={{ display: "block", marginTop: "1rem" }}>
              <Button block>Back to menu after pickup</Button>
            </Link>
          ) : null}
        </Surface>
      ) : null}

      <section className="store-tracking-help" aria-labelledby="help-heading">
        <h2 id="help-heading" className="store-tracking-help__title">
          Need help?
        </h2>
        <p className="store-tracking-help__desc">
          Contact the shop directly if your order is delayed or something looks wrong.
          This order is handled by the merchant.
        </p>
        <Link href={storePath}>
          <Button block variant="secondary">
            Visit {status.merchant.name}
          </Button>
        </Link>
      </section>

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
