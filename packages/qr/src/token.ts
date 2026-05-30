import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export interface PickupTokenPayload {
  orderId: string;
  merchantId: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export type PickupTokenErrorCode =
  | "MALFORMED_TOKEN"
  | "INVALID_SIGNATURE"
  | "EXPIRED_TOKEN"
  | "MERCHANT_MISMATCH"
  | "ORDER_MISMATCH";

export class PickupTokenError extends Error {
  constructor(
    public readonly code: PickupTokenErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PickupTokenError";
  }
}

export interface CreatePickupTokenInput {
  orderId: string;
  merchantId: string;
  secret: string;
  nonce?: string;
  issuedAt?: number;
  expiresAt?: number;
  ttlMs?: number;
}

export interface VerifyPickupTokenInput {
  token: string;
  secret: string;
  expectedMerchantId?: string;
  expectedOrderId?: string;
  now?: number;
}

const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64url")
    .replace(/=+$/u, "");
}

function base64UrlDecode(value: string): string {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(value + padding, "base64url").toString("utf8");
}

function signPayload(payloadBase64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function createPickupToken(input: CreatePickupTokenInput): {
  token: string;
  payload: PickupTokenPayload;
} {
  const issuedAt = input.issuedAt ?? Date.now();
  const expiresAt =
    input.expiresAt ?? issuedAt + (input.ttlMs ?? DEFAULT_TTL_MS);
  const nonce = input.nonce ?? randomBytes(16).toString("hex");

  const payload: PickupTokenPayload = {
    orderId: input.orderId,
    merchantId: input.merchantId,
    issuedAt,
    expiresAt,
    nonce,
  };

  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, input.secret);

  return {
    token: `${payloadBase64}.${signature}`,
    payload,
  };
}

export function verifyPickupToken(
  input: VerifyPickupTokenInput,
): PickupTokenPayload {
  const parts = input.token.split(".");
  if (parts.length !== 2) {
    throw new PickupTokenError("MALFORMED_TOKEN", "Pickup token is malformed");
  }

  const [payloadBase64, signature] = parts as [string, string];
  if (!payloadBase64 || !signature) {
    throw new PickupTokenError("MALFORMED_TOKEN", "Pickup token is malformed");
  }

  const expectedSignature = signPayload(payloadBase64, input.secret);
  if (!safeEqual(signature, expectedSignature)) {
    throw new PickupTokenError("INVALID_SIGNATURE", "Pickup token signature is invalid");
  }

  let payload: PickupTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadBase64)) as PickupTokenPayload;
  } catch {
    throw new PickupTokenError("MALFORMED_TOKEN", "Pickup token payload is invalid");
  }

  if (
    typeof payload.orderId !== "string" ||
    typeof payload.merchantId !== "string" ||
    typeof payload.issuedAt !== "number" ||
    typeof payload.expiresAt !== "number" ||
    typeof payload.nonce !== "string"
  ) {
    throw new PickupTokenError("MALFORMED_TOKEN", "Pickup token payload is incomplete");
  }

  const now = input.now ?? Date.now();
  if (payload.expiresAt <= now) {
    throw new PickupTokenError("EXPIRED_TOKEN", "Pickup token has expired");
  }

  if (
    input.expectedMerchantId &&
    payload.merchantId !== input.expectedMerchantId
  ) {
    throw new PickupTokenError(
      "MERCHANT_MISMATCH",
      "Pickup token does not match this merchant",
    );
  }

  if (input.expectedOrderId && payload.orderId !== input.expectedOrderId) {
    throw new PickupTokenError(
      "ORDER_MISMATCH",
      "Pickup token does not match this order",
    );
  }

  return payload;
}

export const PICKUP_TOKEN_TTL_MS = DEFAULT_TTL_MS;
