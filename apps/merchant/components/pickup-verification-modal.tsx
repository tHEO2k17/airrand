"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { PickupVerificationPanel } from "./pickup-verification-panel";
import type { VerifyPickupSuccess } from "../lib/verify-pickup";

export function PickupVerificationModal({
  open,
  onClose,
  onVerified,
  orderReference,
}: {
  open: boolean;
  onClose: () => void;
  onVerified?: (result: VerifyPickupSuccess) => void;
  orderReference?: string | null;
}) {
  const handleVerified = useCallback(
    (result: VerifyPickupSuccess) => {
      onVerified?.(result);
    },
    [onVerified],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="pos-modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="pos-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pickup-verification-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="pos-modal__header">
          <h2 id="pickup-verification-title" className="pos-section-title">
            Verify pickup
            {orderReference ? ` · ${orderReference}` : ""}
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Close pickup verification"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </Button>
        </header>

        {/* Unmount panel on close so PickupScanner teardown runs and camera stops. */}
        <PickupVerificationPanel
          key={orderReference ?? "pickup-modal"}
          variant="modal"
          orderReference={orderReference}
          onVerified={handleVerified}
        />

        <footer className="pos-modal__footer">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}
