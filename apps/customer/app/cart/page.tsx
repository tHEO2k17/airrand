"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertMessage } from "../../components/ui/alert-message";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { LoadingState } from "../../components/ui/loading-state";
import { Surface } from "../../components/ui/surface";
import { PickupDisclaimer } from "../../components/pickup-disclaimer";
import { useCart } from "../../components/cart-context";
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

    const trimmedContact = customerContact.trim();
    if (!trimmedContact) {
      setError("Your phone number is required.");
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
        customerContact: trimmedContact,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      saveOrderConfirmation({
        orderId: order.id,
        reference: order.reference,
        merchantId: order.merchantId,
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
    <div className="store-page">
      <header className="store-hero">
        <h1>Your cart</h1>
        <p>Review items and reserve for pickup.</p>
      </header>

      <PickupDisclaimer />
      {merchantError ? <AlertMessage variant="error" message={merchantError} /> : null}
      {error ? <AlertMessage variant="error" message={error} /> : null}

      {items.length === 0 ? (
        <Surface>
          <EmptyState
            title="Your cart is empty"
            description="Browse the menu and add items to reserve for pickup."
          />
          <Link href="/" style={{ display: "block", marginTop: "1rem" }}>
            <Button block variant="secondary">
              Back to menu
            </Button>
          </Link>
        </Surface>
      ) : (
        <>
          <div className="store-cart-layout">
          <Surface padding="lg">
            <div className="store-cart-list">
              {items.map((item) => (
                <div key={item.productId} className="store-cart-row">
                  <div>
                    <p className="store-cart-row__name">{item.name}</p>
                    <p className="store-cart-row__price">
                      {formatMoney(item.unitPriceCents)} each
                    </p>
                  </div>
                  <div className="store-qty">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    >
                      −
                    </Button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(item.productId, Number(e.target.value))
                      }
                      aria-label={`Quantity for ${item.name}`}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="store-total-row">
              <div>
                <span>Estimated order value</span>
                <p className="store-total-hint">Catalog prices only — not a payment total</p>
              </div>
              <strong>{formatMoney(subtotalCents)}</strong>
            </div>
          </Surface>

          <Surface padding="lg">
            <h2 className="store-section-title">Pickup details</h2>
            <form className="store-form" onSubmit={handleSubmit}>
              <label>
                Phone number (required)
                <input
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+233 24 412 3456"
                />
              </label>
              <label>
                Your name (optional)
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                  placeholder="First name or nickname"
                />
              </label>
              <label>
                Order notes (optional)
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
              <Button type="submit" block disabled={submitting}>
                {submitting ? "Placing order…" : "Place Order for Pickup"}
              </Button>
            </form>
          </Surface>
          </div>
        </>
      )}
    </div>
  );
}
