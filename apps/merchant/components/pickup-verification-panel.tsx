"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertMessage } from "./ui/alert-message";
import { PickupScanner } from "./pickup-scanner";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Surface } from "./ui/surface";
import { useMerchant } from "./merchant-context";
import { formatDateTime } from "../lib/format";
import {
  verifyPickupToken,
  type VerifyPickupSuccess,
} from "../lib/verify-pickup";

export function PickupVerificationPanel({
  disabled = false,
  orderReference,
  onVerified,
  onAutoClose,
  variant = "page",
}: {
  disabled?: boolean;
  /** Shown in copy when opened for a specific ready order. */
  orderReference?: string | null;
  onVerified?: (result: VerifyPickupSuccess) => void;
  onAutoClose?: () => void;
  variant?: "page" | "modal";
}) {
  const { merchantId } = useMerchant();
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<VerifyPickupSuccess | null>(
    null,
  );
  const [scannerEnabled, setScannerEnabled] = useState(true);

  const runVerify = useCallback(
    async (rawToken: string) => {
      if (!merchantId || saving || disabled) {
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);
      setVerifiedOrder(null);

      const result = await verifyPickupToken(merchantId, rawToken);

      if (result.ok) {
        setSuccess("Pickup verified successfully.");
        setVerifiedOrder(result.data);
        setToken("");
        setScannerEnabled(false);
        onVerified?.(result.data);
      } else {
        setError(result.message);
      }

      setSaving(false);
    },
    [merchantId, saving, disabled, onVerified],
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

  function handleScanAnother() {
    setScannerEnabled(true);
    setError(null);
    setSuccess(null);
    setVerifiedOrder(null);
  }

  useEffect(() => {
    if (variant !== "modal" || !verifiedOrder || !onAutoClose) {
      return;
    }

    const timer = window.setTimeout(() => {
      onAutoClose();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [variant, verifiedOrder, onAutoClose]);

  const intro =
    variant === "modal"
      ? orderReference
        ? `Verify pickup for ${orderReference}. Scan the customer QR or paste the token.`
        : "Scan the customer QR code or paste the token manually."
      : "Scan the customer QR code or paste the token manually. The server verifies the signature and order state.";

  return (
    <div className="pickup-verification-panel">
      <p className="pos-muted">{intro}</p>

      {error ? <AlertMessage variant="error" message={error} /> : null}
      {success ? <AlertMessage variant="success" message={success} /> : null}

      {!verifiedOrder ? (
        <>
          <Surface className={variant === "modal" ? "pickup-verification-panel__block" : undefined}>
            <h2 className="pos-section-title">Camera scan</h2>
            {scannerEnabled && !saving ? (
              <PickupScanner onScan={handleScan} disabled={disabled || saving} />
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || saving}
                onClick={handleScanAnother}
              >
                Scan another code
              </Button>
            )}
          </Surface>

          <Surface className={variant === "modal" ? "pickup-verification-panel__block" : undefined}>
            <h2 className="pos-section-title">Manual entry</h2>
            <form className="pos-form-grid" onSubmit={handleVerify}>
              <label>
                Pickup token
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from customer QR…"
                  disabled={disabled || saving}
                />
              </label>
              <Button type="submit" disabled={disabled || saving}>
                {saving ? "Verifying…" : "Verify pickup"}
              </Button>
            </form>
          </Surface>
        </>
      ) : (
        <Surface className={variant === "modal" ? "pickup-verification-panel__block" : undefined}>
          <h2 className="pos-section-title">Verified</h2>
          <p>
            <strong>{verifiedOrder.reference}</strong>
          </p>
          <p>
            Status: <StatusBadge status={verifiedOrder.status as "picked_up"} />
          </p>
          <p className="pos-muted">
            Verified at {formatDateTime(verifiedOrder.verifiedAt)}
          </p>
          <div className="pickup-verification-panel__actions">
            <Button type="button" variant="secondary" onClick={handleScanAnother}>
              Verify another
            </Button>
          </div>
        </Surface>
      )}
    </div>
  );
}
