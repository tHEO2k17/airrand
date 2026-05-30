const SESSION_STORAGE_KEY = "airrand_merchant_session";

export interface StoredMerchantSession {
  token: string;
}

export function getStoredSession(): StoredMerchantSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredMerchantSession;
    if (typeof parsed.token !== "string" || !parsed.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredMerchantSession): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
