"use client";

import type { CustomerOrderStatusResponse } from "@airrand/contracts";
import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "./config";
import { consumeSseStream } from "./sse-client";
import { isTerminalOrderStatus } from "./order-status-timeline";

export type OrderRealtimeConnectionStatus = "live" | "reconnecting" | "polling";

const POLL_INTERVAL_MS = 12_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useOrderRealtime(options: {
  merchantId: string;
  orderId: string;
  enabled: boolean;
  onStatus: (status: CustomerOrderStatusResponse) => void;
  onPoll: () => void | Promise<void>;
}): { connectionStatus: OrderRealtimeConnectionStatus } {
  const { merchantId, orderId, enabled, onStatus, onPoll } = options;
  const [connectionStatus, setConnectionStatus] =
    useState<OrderRealtimeConnectionStatus>("reconnecting");

  const onStatusRef = useRef(onStatus);
  const onPollRef = useRef(onPoll);
  onStatusRef.current = onStatus;
  onPollRef.current = onPoll;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (connectionStatus !== "polling") {
      return;
    }

    const id = window.setInterval(() => {
      void onPollRef.current();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [connectionStatus, enabled]);

  useEffect(() => {
    if (!enabled || !merchantId || !orderId) {
      return;
    }

    const abort = new AbortController();
    let cancelled = false;
    let attempt = 0;

    async function connect(): Promise<void> {
      if (cancelled) {
        return;
      }

      setConnectionStatus((current) =>
        current === "polling" ? "polling" : "reconnecting",
      );

      try {
        await consumeSseStream({
          url: `${getApiBaseUrl()}/merchants/${merchantId}/orders/${orderId}/events`,
          signal: abort.signal,
          onOpen: () => {
            attempt = 0;
            setConnectionStatus("live");
          },
          onEvent: (event, data) => {
            if (event === "heartbeat" || event === "connected") {
              return;
            }

            try {
              const envelope = JSON.parse(data) as {
                data?: { status?: CustomerOrderStatusResponse };
              };
              const status = envelope.data?.status;
              if (status) {
                onStatusRef.current(status);
                if (isTerminalOrderStatus(status.status)) {
                  abort.abort();
                }
              }
            } catch {
              void onPollRef.current();
            }
          },
        });

        if (!cancelled && !abort.signal.aborted) {
          attempt += 1;
          if (attempt >= 3) {
            setConnectionStatus("polling");
            return;
          }
          setConnectionStatus("reconnecting");
          await sleep(Math.min(1000 * attempt, 5000));
          await connect();
        }
      } catch {
        if (cancelled || abort.signal.aborted) {
          return;
        }
        attempt += 1;
        if (attempt >= 3) {
          setConnectionStatus("polling");
          return;
        }
        setConnectionStatus("reconnecting");
        await sleep(Math.min(1000 * attempt, 5000));
        await connect();
      }
    }

    void connect();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [enabled, merchantId, orderId]);

  return { connectionStatus };
}
