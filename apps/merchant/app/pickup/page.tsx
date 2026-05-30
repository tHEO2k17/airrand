"use client";

import { FormEvent, useState } from "react";
import { Alert } from "../../components/alert";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { StatusPill } from "../../components/status-pill";
import { useMerchant } from "../../components/merchant-context";
import { ApiError, verifyPickup } from "../../lib/api";
import { decodePickupTokenForRouting } from "../../lib/decode-pickup-token";
import { formatDateTime } from "../../lib/format";

function PickupContent() {
  const { merchantId } = useMerchant();
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<{
    id: string;
    status: string;
    verifiedAt: string;
  } | null>(null);

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (!merchantId) {
      return;
    }

    const trimmed = token.trim();
    if (!trimmed) {
      setError("Paste a pickup token to verify.");
      return;
    }

    const routing = decodePickupTokenForRouting(trimmed);
    if (!routing) {
      setError("Token format is invalid. Check the pasted value and try again.");
      return;
    }

    if (routing.merchantId !== merchantId) {
      setError("This token belongs to a different merchant.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setVerifiedOrder(null);

    try {
      const result = await verifyPickup(
        merchantId,
        routing.orderId,
        trimmed,
      );
      setSuccess("Pickup verified successfully.");
      setVerifiedOrder({
        id: result.order.id,
        status: result.order.status,
        verifiedAt: result.verifiedAt,
      });
      setToken("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Pickup verification"
      description="Paste the customer's pickup token. The server verifies the signature and order state."
    >
      {error ? <Alert variant="error" message={error} /> : null}
      {success ? <Alert variant="success" message={success} /> : null}

      <div className="card">
        <p className="inline-muted">
          Order ID is read from the token payload for routing only. Trust always
          comes from server verification.
        </p>
        <form className="form-grid" onSubmit={handleVerify}>
          <label>
            Pickup token
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token from customer QR…"
            />
          </label>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Verifying…" : "Verify pickup"}
          </button>
        </form>
      </div>

      {verifiedOrder ? (
        <div className="card">
          <h2>Last verified order</h2>
          <p>
            <code>{verifiedOrder.id}</code>
          </p>
          <p>
            Status: <StatusPill status={verifiedOrder.status as "picked_up"} />
          </p>
          <p className="inline-muted">
            Verified at {formatDateTime(verifiedOrder.verifiedAt)}
          </p>
        </div>
      ) : null}
    </PageShell>
  );
}

export default function PickupPage() {
  return (
    <MerchantGate>
      <PickupContent />
    </MerchantGate>
  );
}
