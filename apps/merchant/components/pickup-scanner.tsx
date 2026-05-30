"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const SCANNER_ELEMENT_ID = "pickup-qr-scanner";

export function PickupScanner({
  onScan,
  disabled,
}: {
  onScan: (token: string) => void;
  disabled: boolean;
}) {
  const reactId = useId();
  const elementId = `${SCANNER_ELEMENT_ID}-${reactId.replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Camera may already be stopped when unmounting.
    } finally {
      scannerRef.current = null;
      setActive(false);
    }
  }, []);

  useEffect(() => {
    if (disabled) {
      void stopScanner();
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (cancelled || disabled) {
            return;
          }
          onScan(decodedText);
          void stopScanner();
        },
        () => {
          // Ignore per-frame scan misses.
        },
      )
      .then(() => {
        if (!cancelled) {
          setActive(true);
          setCameraError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCameraError(
            error instanceof Error
              ? error.message
              : "Could not access the camera. Use manual entry below.",
          );
        }
      });

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [disabled, elementId, onScan, stopScanner]);

  return (
    <div className="pickup-scanner">
      <div id={elementId} className="pickup-scanner-viewport" />
      {cameraError ? (
        <p className="inline-muted">{cameraError}</p>
      ) : (
        <p className="inline-muted">
          {active
            ? "Point the camera at the customer pickup QR code."
            : "Starting camera…"}
        </p>
      )}
    </div>
  );
}
