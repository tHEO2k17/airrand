"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  createScannerSessionGuard,
  releaseHtml5QrcodeScanner,
} from "../lib/pickup-scanner-lifecycle";
import { Button } from "./ui/button";

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
  const mountedRef = useRef(true);
  const startingRef = useRef(false);
  const sessionRef = useRef(createScannerSessionGuard());
  const onScanRef = useRef(onScan);

  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  onScanRef.current = onScan;

  const releaseScanner = useCallback(async () => {
    sessionRef.current.bumpGeneration();

    const scanner = scannerRef.current;
    scannerRef.current = null;

    await releaseHtml5QrcodeScanner(scanner, elementId);

    if (mountedRef.current) {
      setActive(false);
      setStarting(false);
    }
  }, [elementId]);

  const stopCamera = useCallback(async () => {
    await releaseScanner();
  }, [releaseScanner]);

  const startCamera = useCallback(async () => {
    if (
      disabled ||
      startingRef.current ||
      scannerRef.current?.isScanning
    ) {
      return;
    }

    startingRef.current = true;
    setStarting(true);
    setCameraError(null);
    sessionRef.current.resetScanHandled();

    await releaseScanner();

    if (!mountedRef.current || disabled) {
      startingRef.current = false;
      setStarting(false);
      return;
    }

    const generation = sessionRef.current.bumpGeneration();
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (
            !mountedRef.current ||
            disabled ||
            !sessionRef.current.isCurrentGeneration(generation) ||
            !sessionRef.current.markScanHandled()
          ) {
            return;
          }

          onScanRef.current(decodedText);
          void stopCamera();
        },
        () => {
          // Ignore per-frame scan misses.
        },
      );

      if (
        !mountedRef.current ||
        disabled ||
        !sessionRef.current.isCurrentGeneration(generation)
      ) {
        await releaseHtml5QrcodeScanner(scanner, elementId);
        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
        return;
      }

      setActive(true);
    } catch (error: unknown) {
      await releaseHtml5QrcodeScanner(scanner, elementId);
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }

      if (mountedRef.current && sessionRef.current.isCurrentGeneration(generation)) {
        setCameraError(
          error instanceof Error
            ? error.message
            : "Could not access the camera. Use manual entry below.",
        );
      }
    } finally {
      startingRef.current = false;
      if (mountedRef.current) {
        setStarting(false);
      }
    }
  }, [disabled, elementId, releaseScanner, stopCamera]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void releaseScanner();
    };
  }, [releaseScanner]);

  useEffect(() => {
    if (disabled) {
      void stopCamera();
    }
  }, [disabled, stopCamera]);

  return (
    <div className="pickup-scanner">
      <div id={elementId} className="pickup-scanner-viewport" />
      <div className="pickup-scanner-actions">
        {!active ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || starting}
            onClick={() => void startCamera()}
          >
            {starting ? "Starting camera…" : "Start camera"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || starting}
            onClick={() => void stopCamera()}
          >
            Stop camera
          </Button>
        )}
      </div>
      {cameraError ? (
        <p className="inline-muted">{cameraError}</p>
      ) : (
        <p className="inline-muted">
          {active
            ? "Point the camera at the customer pickup QR code."
            : "Start the camera to scan, or paste the token manually below."}
        </p>
      )}
    </div>
  );
}
