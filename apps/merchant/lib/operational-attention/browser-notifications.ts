export type BrowserNotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export function getBrowserNotificationPermission(): BrowserNotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const result = await Notification.requestPermission();
  return result;
}

const activeNotificationTags = new Set<string>();

export function showOperationalNotification(options: {
  tag: string;
  title: string;
  body: string;
  onClick?: () => void;
}): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  if (activeNotificationTags.has(options.tag)) {
    return;
  }

  activeNotificationTags.add(options.tag);

  const notification = new Notification(options.title, {
    body: options.body,
    tag: options.tag,
    icon: "/favicon.ico",
  });

  notification.onclick = () => {
    window.focus();
    options.onClick?.();
    notification.close();
  };

  notification.onclose = () => {
    activeNotificationTags.delete(options.tag);
  };
}

export function clearOperationalNotificationStateForTests(): void {
  activeNotificationTags.clear();
}
