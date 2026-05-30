"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyToken } from "../../components/copy-token";
import { PickupQr } from "../../components/pickup-qr";
import {
  readOrderConfirmation,
  type StoredOrderConfirmation,
} from "../../lib/order-confirmation";
import { formatDateTime } from "../../lib/format";

export default function OrderConfirmationPage() {
  const [confirmation, setConfirmation] = useState<StoredOrderConfirmation | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConfirmation(readOrderConfirmation());
    setReady(true);
  }, []);

  if (!ready) {
    return <p className="loading-state">Loading confirmation…</p>;
  }

  if (!confirmation) {
    return (
      <section className="page-shell">
        <div className="card">
          <h1>No order found</h1>
          <p className="page-description">
            Place an order from your cart to see your pickup code here.
          </p>
          <Link href="/" className="btn">
            Back to menu
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <header className="page-header">
        <h1>Order confirmed</h1>
        <p className="page-description">
          Show this code to the merchant when picking up your order.
        </p>
      </header>

      <div className="card">
        <div className="confirmation-meta">
          <p>
            Order ID: <code>{confirmation.orderId}</code>
          </p>
          <p>
            Status: <span className="status-pill">{confirmation.status}</span>
          </p>
          <p>Pickup code expires: {formatDateTime(confirmation.expiresAt)}</p>
        </div>
      </div>

      <div className="card">
        <h2>Pickup QR code</h2>
        <PickupQr token={confirmation.token} />
      </div>

      <div className="card">
        <h2>Pickup token (copy)</h2>
        <CopyToken token={confirmation.token} />
      </div>

      <Link href="/" className="btn btn-secondary">
        Order more items
      </Link>
    </section>
  );
}
