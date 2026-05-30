"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { OrderConfirmationActions } from "../../../../components/order-confirmation-actions";
import { Button } from "../../../../components/ui/button";
import { EmptyState } from "../../../../components/ui/empty-state";
import { LoadingState } from "../../../../components/ui/loading-state";
import { Surface } from "../../../../components/ui/surface";
import { useMerchant } from "../../../../components/merchant-context";
import {
  readOrderConfirmation,
  type StoredOrderConfirmation,
} from "../../../../lib/order-confirmation";
import { buildStorePath } from "../../../../lib/store-paths";

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
    return <LoadingState label="Loading order confirmation…" />;
  }

  const storePath = buildStorePath(merchantSlug);

  if (!confirmation) {
    return (
      <div className="store-page store-page--centered">
        <Surface>
          <EmptyState
            title="No order found for this visit"
            description="Place an order from your cart to get a tracking link for this shop."
          />
          <Link href={storePath} style={{ display: "block", marginTop: "1rem" }}>
            <Button block>Back to menu</Button>
          </Link>
        </Surface>
      </div>
    );
  }

  return (
    <div className="store-page store-page--centered">
      <header className="store-hero">
        <div className="store-empty__icon" style={{ marginBottom: "0.75rem" }}>
          <CheckCircle2 size={32} strokeWidth={1.75} color="var(--store-accent)" />
        </div>
        <h1>Reserved for pickup</h1>
        <p>
          Your order is in. Save your tracking link to follow progress and get your
          pickup code when ready.
        </p>
      </header>

      <OrderConfirmationActions
        confirmation={confirmation}
        merchantSlug={merchantSlug}
      />
    </div>
  );
}
