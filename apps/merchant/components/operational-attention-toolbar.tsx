"use client";

import { Bell, BellOff, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import type { BrowserNotificationPermissionState } from "../lib/operational-attention/browser-notifications";

export function OperationalAttentionToolbar({
  muted,
  onToggleMuted,
  notificationPermission,
  onRequestNotifications,
  focusMode,
  onToggleFocusMode,
}: {
  muted: boolean;
  onToggleMuted: () => void;
  notificationPermission: BrowserNotificationPermissionState;
  onRequestNotifications: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}) {
  const notificationsDenied = notificationPermission === "denied";
  const notificationsUnsupported = notificationPermission === "unsupported";

  return (
    <div className="pos-attention-toolbar" role="toolbar" aria-label="Alert controls">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onToggleMuted}
        aria-pressed={muted}
        aria-label={muted ? "Unmute new order sounds" : "Mute new order sounds"}
      >
        {muted ? <VolumeX size={16} aria-hidden /> : <Volume2 size={16} aria-hidden />}
        {muted ? "Muted" : "Sound on"}
      </Button>

      {!notificationsUnsupported ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={notificationsDenied || notificationPermission === "granted"}
          onClick={() => {
            void onRequestNotifications();
          }}
          aria-label="Enable browser notifications"
        >
          {notificationsDenied ? (
            <BellOff size={16} aria-hidden />
          ) : (
            <Bell size={16} aria-hidden />
          )}
          {notificationsDenied
            ? "Notifications blocked"
            : notificationPermission === "granted"
              ? "Notifications on"
              : "Enable notifications"}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void onToggleFocusMode();
        }}
        aria-pressed={focusMode}
        aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
      >
        {focusMode ? (
          <Minimize2 size={16} aria-hidden />
        ) : (
          <Maximize2 size={16} aria-hidden />
        )}
        {focusMode ? "Exit focus" : "Focus mode"}
      </Button>
    </div>
  );
}
