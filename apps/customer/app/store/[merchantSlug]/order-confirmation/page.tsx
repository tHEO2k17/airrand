"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { CopyToken } from "../../../../components/copy-token";
import { PickupQr } from "../../../../components/pickup-qr";
import { PickupDisclaimer } from "../../../../components/pickup-disclaimer";
import { Button } from "../../../../components/ui/button";
import { EmptyState } from "../../../../components/ui/empty-state";
import { LoadingState } from "../../../../components/ui/loading-state";
import { StatusBadge } from "../../../../components/ui/badge";
import { Surface } from "../../../../components/ui/surface";
import { useMerchant } from "../../../../components/merchant-context";
import {
  readOrderConfirmation,
  type StoredOrderConfirmation,
} from "../../../../lib/order-confirmation";
import { formatDateTime } from "../../../../lib/format";
import {
  buildStorePath,
  buildStoreTrackingPath,
} from "../../../../lib/store-paths";

export default function StoreOrderConfirmationPage() {
  const { merchantSlug } = useMerchant();
  const [confirmation, setConfirmation] = useState<StoredOrderConfirmation | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConfirmation(readOrderConfirmation(merchantSlug));
    setReady(true);
  }, [merchantSlug]);

  if (!ready) {
    return <LoadingState label="Loading pickup code…" />;
  }

  const storePath = buildStorePath(merchantSlug);

  if (!confirmation) {
    return (
      <div className="store-page store-page--centered">
        <Surface>
          <EmptyState
            title="No pickup code found"
            description="Place an order from your cart to get a pickup code for this visit."
          />
          <Link href={storePath} style={{ display: "block", marginTop: "1rem" }}>
            <Button block>Back to menu</Button>
          </Link>
        </Surface>
      </div>
    );
  }

  const trackingPath = buildStoreTrackingPath(
    merchantSlug,
    confirmation.reference,
  );

  return (
    <div className="store-page store-page--centered">
      <header className="store-hero">
        <div className="store-empty__icon" style={{ marginBottom: "0.75rem" }}>
          <CheckCircle2 size={32} strokeWidth={1.75} color="var(--store-accent)" />
        </div>
        <h1>Reserved for pickup</h1>
        <p>
          Show this pickup code to the merchant after your order is ready.
        </p>
      </header>

      <PickupDisclaimer />

      <Surface>
        <h2 className="store-section-title">Order details</h2>
        <ul className="store-meta-list">
          <li>
            <strong>Order reference:</strong> {confirmation.reference}
          </li>
          <li className="store-meta-list__status">
            <strong>Status:</strong> <StatusBadge status={confirmation.status} />
          </li>
          <li>
            <strong>Pickup code expires:</strong>{" "}
            {formatDateTime(confirmation.expiresAt)}
          </li>
        </ul>
        <p className="store-total-hint" style={{ marginTop: "1rem" }}>
          Payment is arranged directly with the merchant.
        </p>
      </Surface>

      <Surface>
        <h2 className="store-section-title">Show Pickup Code</h2>
        <p className="store-total-hint" style={{ marginBottom: "1rem" }}>
          Present this QR at the counter when collecting your order.
        </p>
        <div className="store-pickup-qr">
          <PickupQr token={confirmation.token} />
        </div>
      </Surface>

      <Surface>
        <h2 className="store-section-title">Copy pickup token</h2>
        <CopyToken token={confirmation.token} />
      </Surface>

      <Link href={trackingPath} style={{ display: "block" }}>
        <Button block>Track order status</Button>
      </Link>

      <Link href={storePath}>
        <Button block variant="secondary">
          Order more items
        </Button>
      </Link>
    </div>
  );
}
