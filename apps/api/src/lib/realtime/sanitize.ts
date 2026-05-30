const FORBIDDEN_KEYS = new Set([
  "passwordHash",
  "password_hash",
  "pickupTokenNonce",
  "pickup_token_nonce",
  "token",
  "nonce",
  "secret",
  "authorization",
  "session",
  "customerName",
  "customerContact",
  "notes",
]);

export function sanitizeRealtimePayload(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRealtimePayload(item));
  }

  const record = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(record)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }
    sanitized[key] = sanitizeRealtimePayload(nested);
  }

  return sanitized;
}

export function assertCustomerSafeRealtimePayload(
  payload: Record<string, unknown>,
): void {
  for (const key of FORBIDDEN_KEYS) {
    if (key in payload) {
      throw new Error(`Customer realtime payload must not include ${key}`);
    }
  }

  const serialized = JSON.stringify(payload);
  if (serialized.includes("pickupTokenNonce") || serialized.includes("password_hash")) {
    throw new Error("Customer realtime payload contains forbidden fields");
  }
}
