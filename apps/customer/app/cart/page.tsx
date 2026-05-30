"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "../../components/alert";
import { useCart } from "../../components/cart-context";
import { LoadingState } from "../../components/loading-state";
import { PaymentNote } from "../../components/payment-note";
import { useMerchant } from "../../components/merchant-context";
import { ApiError, createOrder } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import { saveOrderConfirmation } from "../../lib/order-confirmation";

export default function CartPage() {
  const router = useRouter();
  const { merchantId, loading: merchantLoading, error: merchantError } = useMerchant();
  const {
    items,
    subtotalCents,
    hydrated,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!merchantId || submitting) {
      return;
    }

    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setError("Your name is required.");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (items.some((item) => item.quantity <= 0)) {
      setError("Each item must have quantity greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const order = await createOrder(merchantId, {
        lines: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customerName: trimmedName,
        customerContact: customerContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      saveOrderConfirmation({
        orderId: order.id,
        status: order.status,
        token: order.pickup.token,
        expiresAt: order.pickup.expiresAt,
      });

      clearCart();
      router.push("/order-confirmation");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to place order");
      }
      setSubmitting(false);
    }
  }

  if (!hydrated || merchantLoading) {
    return <LoadingState label="Loading cart…" />;
  }

  return (
    <section className="page-shell">
      <header className="page-header">
        <h1>Your cart</h1>
        <p className="page-description">Review items and reserve pickup.</p>
      </header>

      <PaymentNote />
      {merchantError ? <Alert variant="error" message={merchantError} /> : null}
      {error ? <Alert variant="error" message={error} /> : null}

      {items.length === 0 ? (
        <div className="card">
          <p className="page-description">Your cart is empty.</p>
          <Link href="/" className="btn btn-secondary">
            Browse menu
          </Link>
        </div>
      ) : (
        <>
          <div className="card cart-list">
            {items.map((item) => (
              <div key={item.productId} className="cart-row">
                <div>
                  <strong>{item.name}</strong>
                  <p className="page-description">
                    {formatMoney(item.unitPriceCents)} each
                  </p>
                </div>
                <div className="qty-controls">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) =>
                      setQuantity(item.productId, Number(e.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <p className="subtotal">Subtotal (display): {formatMoney(subtotalCents)}</p>
          </div>

          <form className="card form-grid" onSubmit={handleSubmit}>
            <h2>Pickup details</h2>
            <label>
              Your name (required)
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </label>
            <label>
              Contact (optional)
              <input
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="Phone or email"
              />
            </label>
            <label>
              Notes (optional)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Placing order…" : "Place pickup order"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
