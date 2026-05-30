import { createHmac, timingSafeEqual } from "node:crypto";

export type MerchantStaffRole = "owner" | "manager" | "staff";

export interface SessionTokenPayload {
  merchantUserId: string;
  merchantId: string;
  role: MerchantStaffRole;
  email: string;
  issuedAt: number;
  expiresAt: number;
}

export type SessionTokenErrorCode =
  | "MALFORMED_TOKEN"
  | "INVALID_SIGNATURE"
  | "EXPIRED_TOKEN";

export class SessionTokenError extends Error {
  constructor(
    public readonly code: SessionTokenErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SessionTokenError";
  }
}

export interface CreateSessionTokenInput {
  merchantUserId: string;
  merchantId: string;
  role: MerchantStaffRole;
  email: string;
  secret: string;
  issuedAt?: number;
  expiresAt?: number;
  ttlMs?: number;
}

export interface VerifySessionTokenInput {
  token: string;
  secret: string;
  now?: number;
}

export const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url").replace(/=+$/u, "");
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

export function createSessionToken(input: CreateSessionTokenInput): {
  token: string;
  payload: SessionTokenPayload;
} {
  const issuedAt = input.issuedAt ?? Date.now();
  const expiresAt =
    input.expiresAt ?? issuedAt + (input.ttlMs ?? DEFAULT_SESSION_TTL_MS);

  const payload: SessionTokenPayload = {
    merchantUserId: input.merchantUserId,
    merchantId: input.merchantId,
    role: input.role,
    email: input.email,
    issuedAt,
    expiresAt,
  };

  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, input.secret);

  return {
    token: `${payloadBase64}.${signature}`,
    payload,
  };
}

export function verifySessionToken(
  input: VerifySessionTokenInput,
): SessionTokenPayload {
  const parts = input.token.split(".");
  if (parts.length !== 2) {
    throw new SessionTokenError("MALFORMED_TOKEN", "Session token is malformed");
  }

  const [payloadBase64, signature] = parts as [string, string];
  if (!payloadBase64 || !signature) {
    throw new SessionTokenError("MALFORMED_TOKEN", "Session token is malformed");
  }

  const expectedSignature = signPayload(payloadBase64, input.secret);
  if (!safeEqual(signature, expectedSignature)) {
    throw new SessionTokenError(
      "INVALID_SIGNATURE",
      "Session token signature is invalid",
    );
  }

  let payload: SessionTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadBase64)) as SessionTokenPayload;
  } catch {
    throw new SessionTokenError(
      "MALFORMED_TOKEN",
      "Session token payload is invalid",
    );
  }

  if (
    typeof payload.merchantUserId !== "string" ||
    typeof payload.merchantId !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.issuedAt !== "number" ||
    typeof payload.expiresAt !== "number"
  ) {
    throw new SessionTokenError(
      "MALFORMED_TOKEN",
      "Session token payload is incomplete",
    );
  }

  const now = input.now ?? Date.now();
  if (payload.expiresAt <= now) {
    throw new SessionTokenError("EXPIRED_TOKEN", "Session has expired");
  }

  return payload;
}
