"use client";

import { FormEvent, useCallback, useState } from "react";
import { AlertMessage } from "../../components/ui/alert-message";
import { PickupScanner } from "../../components/pickup-scanner";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Surface } from "../../components/ui/surface";
import { useMerchant } from "../../components/merchant-context";
import { formatDateTime } from "../../lib/format";
import { verifyPickupToken } from "../../lib/verify-pickup";

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
  const [scannerEnabled, setScannerEnabled] = useState(true);

  const runVerify = useCallback(
    async (rawToken: string) => {
      if (!merchantId || saving) {
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);
      setVerifiedOrder(null);

      const result = await verifyPickupToken(merchantId, rawToken);

      if (result.ok) {
        setSuccess("Pickup verified successfully.");
        setVerifiedOrder({
          id: result.data.orderId,
          status: result.data.status,
          verifiedAt: result.data.verifiedAt,
        });
        setToken("");
        setScannerEnabled(false);
      } else {
        setError(result.message);
      }

      setSaving(false);
    },
    [merchantId, saving],
  );

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    await runVerify(token);
  }

  const handleScan = useCallback(
    (decoded: string) => {
      setToken(decoded);
      void runVerify(decoded);
    },
    [runVerify],
  );

  return (
    <PageShell
      title="Pickup verification"
      description="Scan the customer QR code or paste the token manually. The server verifies the signature and order state."
    >
      {error ? <AlertMessage variant="error" message={error} /> : null}
      {success ? <AlertMessage variant="success" message={success} /> : null}

      <Surface>
        <h2 className="pos-section-title">Camera scan</h2>
        <p className="pos-muted">
          Order ID is read from the token for routing only. Trust always comes from
          server verification.
        </p>
        {scannerEnabled && !saving && !verifiedOrder ? (
          <PickupScanner onScan={handleScan} disabled={saving} />
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setScannerEnabled(true);
              setError(null);
              setSuccess(null);
            }}
          >
            Scan another code
          </Button>
        )}
      </Surface>

      <Surface>
        <h2 className="pos-section-title">Manual entry</h2>
        <form className="pos-form-grid" onSubmit={handleVerify}>
          <label>
            Pickup token
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token from customer QR…"
            />
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? "Verifying…" : "Verify pickup"}
          </Button>
        </form>
      </Surface>

      {verifiedOrder ? (
        <Surface>
          <h2 className="pos-section-title">Last verified order</h2>
          <p>
            <code>{verifiedOrder.id}</code>
          </p>
          <p>
            Status: <StatusBadge status={verifiedOrder.status as "picked_up"} />
          </p>
          <p className="pos-muted">
            Verified at {formatDateTime(verifiedOrder.verifiedAt)}
          </p>
        </Surface>
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
