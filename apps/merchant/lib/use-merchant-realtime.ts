"use client";

import type { RealtimeEventType } from "@airrand/contracts";
import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "./config";
import { getAuthToken } from "./api";
import {
  parseRealtimeEventMessage,
  type ParsedRealtimeEvent,
} from "./operational-attention/parse-realtime-event";
import { consumeSseStream } from "./sse-client";
import { usePollingRefresh } from "./use-polling-refresh";

export type RealtimeConnectionStatus = "live" | "reconnecting" | "polling";

const ORDER_EVENTS: ReadonlySet<RealtimeEventType> = new Set([
  "order.created",
  "order.status_changed",
  "order.pickup_verified",
]);

const PRODUCT_EVENTS: ReadonlySet<RealtimeEventType> = new Set([
  "product.created",
  "product.updated",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useMerchantRealtime(options: {
  merchantId: string | null;
  token: string | null;
  enabled: boolean;
  onRefresh: () => void | Promise<void>;
  onRealtimeEvent?: (event: ParsedRealtimeEvent) => void;
  onConnectionOpen?: (info: { reconnect: boolean }) => void;
  pollIntervalMs?: number;
}): { connectionStatus: RealtimeConnectionStatus } {
  const {
    merchantId,
    token,
    enabled,
    onRefresh,
    onRealtimeEvent,
    onConnectionOpen,
    pollIntervalMs = 10_000,
  } = options;

  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("reconnecting");
  const onRefreshRef = useRef(onRefresh);
  const onRealtimeEventRef = useRef(onRealtimeEvent);
  const onConnectionOpenRef = useRef(onConnectionOpen);
  const hasConnectedBeforeRef = useRef(false);
  onRefreshRef.current = onRefresh;
  onRealtimeEventRef.current = onRealtimeEvent;
  onConnectionOpenRef.current = onConnectionOpen;

  const pollingEnabled =
    enabled && Boolean(merchantId) && connectionStatus === "polling";

  usePollingRefresh(
    () => onRefreshRef.current(),
    pollIntervalMs,
    pollingEnabled,
  );

  useEffect(() => {
    if (!enabled || !merchantId || !token) {
      setConnectionStatus("polling");
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
          url: `${getApiBaseUrl()}/merchants/${merchantId}/events`,
          headers: { Authorization: `Bearer ${getAuthToken() ?? token}` },
          signal: abort.signal,
          onOpen: () => {
            const reconnect = hasConnectedBeforeRef.current;
            hasConnectedBeforeRef.current = true;
            attempt = 0;
            setConnectionStatus("live");
            onConnectionOpenRef.current?.({ reconnect });
          },
          onEvent: (event, data) => {
            if (event === "heartbeat" || event === "connected") {
              return;
            }

            try {
              const parsed = parseRealtimeEventMessage(data);
              if (parsed) {
                onRealtimeEventRef.current?.(parsed);
              }

              const type = parsed?.type ?? (JSON.parse(data) as { type?: RealtimeEventType }).type;
              if (
                type &&
                (ORDER_EVENTS.has(type) || PRODUCT_EVENTS.has(type))
              ) {
                void onRefreshRef.current();
              }
            } catch {
              void onRefreshRef.current();
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
  }, [enabled, merchantId, token]);

  return { connectionStatus };
}
