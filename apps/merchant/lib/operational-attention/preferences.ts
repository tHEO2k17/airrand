import { MUTE_PREFERENCE_KEY } from "./constants";

function getStorage(): Storage | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  return globalThis.localStorage ?? null;
}

export function readAlertsMuted(): boolean {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  return storage.getItem(MUTE_PREFERENCE_KEY) === "1";
}

export function writeAlertsMuted(muted: boolean): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(MUTE_PREFERENCE_KEY, muted ? "1" : "0");
}
