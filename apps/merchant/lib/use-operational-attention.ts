"use client";

import type { OrderResponse } from "@airrand/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearOperationalNotificationStateForTests,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showOperationalNotification,
  type BrowserNotificationPermissionState,
} from "./operational-attention/browser-notifications";
import { NEW_ORDER_BADGE_MS } from "./operational-attention/constants";
import {
  hasProcessedEventId,
  registerProcessedEventId,
} from "./operational-attention/event-dedupe";
import {
  collectOrderIds,
  detectNewOrdersOnRefresh,
  isRecentOrder,
} from "./operational-attention/new-order-detection";
import {
  notificationBodyForEvent,
  notificationTitleForEvent,
  shouldNotifyForRealtimeEvent,
  shouldPlaySoundForRealtimeEvent,
} from "./operational-attention/order-alerts";
import type { ParsedRealtimeEvent } from "./operational-attention/parse-realtime-event";
import {
  playNewOrderChime,
  unlockOperationalAudio,
} from "./operational-attention/play-new-order-sound";
import {
  readAlertsMuted,
  writeAlertsMuted,
} from "./operational-attention/preferences";

export type SyncOrdersReason = "initial" | "refresh" | "reconnect";

export function useOperationalAttention(options?: {
  notifyOnReady?: boolean;
}) {
  const notifyOnReady = options?.notifyOnReady ?? true;
  const [muted, setMutedState] = useState(false);
  const [unreadOrderIds, setUnreadOrderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [highlightOrderIds, setHighlightOrderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [notificationPermission, setNotificationPermission] =
    useState<BrowserNotificationPermissionState>("default");
  const [focusMode, setFocusMode] = useState(false);

  const baselineOrderIdsRef = useRef<Set<string>>(new Set());
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const reconcilingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    setMutedState(readAlertsMuted());
    setNotificationPermission(getBrowserNotificationPermission());
  }, []);

  const addUnreadOrder = useCallback((orderId: string) => {
    setUnreadOrderIds((current) => new Set(current).add(orderId));
    setHighlightOrderIds((current) => new Set(current).add(orderId));
  }, []);

  const triggerAttention = useCallback(
    async (event: ParsedRealtimeEvent) => {
      const orderId = event.orderId ?? event.order?.id;
      if (!orderId) {
        return;
      }

      addUnreadOrder(orderId);

      if (!muted && shouldPlaySoundForRealtimeEvent(event)) {
        await playNewOrderChime();
      }

      if (
        shouldNotifyForRealtimeEvent(event, { notifyOnReady }) &&
        notificationPermission === "granted"
      ) {
        showOperationalNotification({
          tag: `${event.type}:${orderId}`,
          title: notificationTitleForEvent(event),
          body: notificationBodyForEvent(event),
          onClick: () => {
            window.focus();
          },
        });
      }
    },
    [addUnreadOrder, muted, notificationPermission, notifyOnReady],
  );

  const handleRealtimeEvent = useCallback(
    async (event: ParsedRealtimeEvent) => {
      if (hasProcessedEventId(processedEventIdsRef.current, event.id)) {
        return;
      }
      processedEventIdsRef.current = registerProcessedEventId(
        processedEventIdsRef.current,
        event.id,
      );

      if (event.type === "order.created" && event.order?.id) {
        baselineOrderIdsRef.current.add(event.order.id);
      }

      if (
        event.type === "order.created" ||
        (notifyOnReady &&
          event.type === "order.status_changed" &&
          event.order?.status === "ready")
      ) {
        await triggerAttention(event);
      }
    },
    [notifyOnReady, triggerAttention],
  );

  const syncOrdersAfterLoad = useCallback(
    async (
      orders: OrderResponse[],
      meta: { reason: SyncOrdersReason; allowPollAlerts?: boolean },
    ) => {
      const ids = collectOrderIds(orders);

      if (meta.reason === "initial" || !initialLoadDoneRef.current) {
        baselineOrderIdsRef.current = ids;
        initialLoadDoneRef.current = true;
        return;
      }

      if (meta.reason === "reconnect" || reconcilingRef.current) {
        for (const id of ids) {
          baselineOrderIdsRef.current.add(id);
        }
        return;
      }

      if (meta.reason === "refresh" && meta.allowPollAlerts) {
        const newOrders = detectNewOrdersOnRefresh({
          previousIds: baselineOrderIdsRef.current,
          orders,
        });

        for (const order of newOrders) {
          if (hasProcessedEventId(processedEventIdsRef.current, `poll:${order.id}`)) {
            continue;
          }
          processedEventIdsRef.current = registerProcessedEventId(
            processedEventIdsRef.current,
            `poll:${order.id}`,
          );
          await triggerAttention({
            id: `poll:${order.id}`,
            type: "order.created",
            merchantId: order.merchantId,
            orderId: order.id,
            timestamp: order.createdAt,
            order,
          });
        }
      }

      for (const id of ids) {
        baselineOrderIdsRef.current.add(id);
      }
    },
    [triggerAttention],
  );

  const beginReconnectReconcile = useCallback(() => {
    reconcilingRef.current = true;
  }, []);

  const endReconnectReconcile = useCallback(() => {
    reconcilingRef.current = false;
  }, []);

  const markOrderRead = useCallback((orderId: string) => {
    setUnreadOrderIds((current) => {
      if (!current.has(orderId)) {
        return current;
      }
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadOrderIds(new Set());
  }, []);

  const setMuted = useCallback((value: boolean) => {
    writeAlertsMuted(value);
    setMutedState(value);
  }, []);

  const toggleMuted = useCallback(() => {
    void unlockOperationalAudio();
    setMuted(!muted);
  }, [muted, setMuted]);

  const requestNotifications = useCallback(async () => {
    await unlockOperationalAudio();
    const permission = await requestBrowserNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const unlockAudio = useCallback(async () => {
    await unlockOperationalAudio();
  }, []);

  const toggleFocusMode = useCallback(async () => {
    await unlockOperationalAudio();
    setFocusMode((current) => !current);
  }, []);

  useEffect(() => {
    if (!focusMode) {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
      return;
    }

    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      void root.requestFullscreen().catch(() => {
        setFocusMode(false);
      });
    }

    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        setFocusMode(false);
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [focusMode]);

  const isOrderUnread = useCallback(
    (orderId: string) => unreadOrderIds.has(orderId),
    [unreadOrderIds],
  );

  const isOrderNew = useCallback(
    (order: OrderResponse, now = Date.now()) =>
      highlightOrderIds.has(order.id) &&
      order.status === "placed" &&
      isRecentOrder(order, now, NEW_ORDER_BADGE_MS),
    [highlightOrderIds],
  );

  return {
    muted,
    setMuted,
    toggleMuted,
    unreadOrderIds,
    hasUnreadOrders: unreadOrderIds.size > 0,
    notificationPermission,
    requestNotifications,
    unlockAudio,
    focusMode,
    toggleFocusMode,
    handleRealtimeEvent,
    syncOrdersAfterLoad,
    beginReconnectReconcile,
    endReconnectReconcile,
    markOrderRead,
    markAllRead,
    isOrderUnread,
    isOrderNew,
    clearOperationalNotificationStateForTests,
  };
}
