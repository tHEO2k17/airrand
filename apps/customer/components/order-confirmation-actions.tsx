"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PickupQr } from "./pickup-qr";
import { PickupQrLockedPlaceholder } from "./pickup-qr-locked";
import { PickupDisclaimer } from "./pickup-disclaimer";
import { CopyTrackingLink } from "./copy-tracking-link";
import { Button } from "./ui/button";
import { Surface } from "./ui/surface";
import { OrderConfirmationLiveStatus } from "./order-confirmation-live";
import { fetchOrderStatus } from "../lib/api";
import {
  shouldShowPickupQr,
  shouldShowPickupQrLocked,
} from "../lib/pickup-qr-eligibility";
import { isTerminalOrderStatus } from "../lib/order-status-timeline";
import { useOrderRealtime } from "../lib/use-order-realtime";
import type { StoredOrderConfirmation } from "../lib/order-confirmation";
import {
  buildStorePath,
  buildStoreTrackingPath,
} from "../lib/store-paths";

export function OrderConfirmationActions({
  confirmation,
  merchantSlug,
}: {
  confirmation: StoredOrderConfirmation;
  merchantSlug: string;
}) {
  const trackingPath = buildStoreTrackingPath(merchantSlug, confirmation.reference);
  const storePath = buildStorePath(merchantSlug);
  const [status, setStatus] = useState(confirmation.status);

  useEffect(() => {
    setStatus(confirmation.status);
  }, [confirmation.status]);

  const realtimeEnabled = !isTerminalOrderStatus(status);

  useOrderRealtime({
    merchantId: confirmation.merchantId,
    orderId: confirmation.orderId,
    enabled: realtimeEnabled,
    onStatus: (next) => setStatus(next.status),
    onPoll: async () => {
      const next = await fetchOrderStatus(
        confirmation.merchantId,
        confirmation.orderId,
      );
      setStatus(next.status);
    },
  });

  const showQr = shouldShowPickupQr(status);
  const showLocked = shouldShowPickupQrLocked(status);

  return (
    <>
      <Surface className="store-confirmation-track">
        <h2 className="store-section-title">Save your tracking link</h2>
        <p className="store-total-hint" style={{ marginBottom: "1rem" }}>
          Save this link. You can use it later to see your pickup code when the
          shop marks your order as ready.
        </p>
        <div className="store-tracking-actions">
          <CopyTrackingLink
            merchantSlug={merchantSlug}
            reference={confirmation.reference}
          />
        </div>
        <Link href={trackingPath} style={{ display: "block", marginTop: "1rem" }}>
          <Button block>Track order</Button>
        </Link>
      </Surface>

      <PickupDisclaimer />

      <Surface>
        <h2 className="store-section-title">Order details</h2>
        <ul className="store-meta-list">
          <li>
            <strong>Order reference:</strong> {confirmation.reference}
          </li>
          <li className="store-meta-list__status">
            <strong>Status:</strong>{" "}
            <OrderConfirmationLiveStatus confirmation={confirmation} />
          </li>
        </ul>
        <p className="store-total-hint" style={{ marginTop: "1rem" }}>
          Payment is arranged directly with the shop.
        </p>
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
            <PickupQr token={confirmation.token} />
          </div>
        </Surface>
      ) : null}

      {status === "picked_up" ? (
        <Surface>
          <p className="store-section-title">Order collected</p>
          <p className="store-total-hint">
            Thanks for picking up. This order is handled by the shop.
          </p>
        </Surface>
      ) : null}

      <Link href={storePath}>
        <Button block variant="secondary">
          Order more items
        </Button>
      </Link>
    </>
  );
}
