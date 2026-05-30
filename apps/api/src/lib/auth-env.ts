import { DEFAULT_SESSION_TTL_MS } from "@airrand/auth";

const MIN_SECRET_LENGTH = 32;

export function getAuthSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      "AUTH_SESSION_SECRET must be set to at least 32 characters",
    );
  }
  return secret;
}

export function getAuthSessionTtlMs(): number {
  const raw = process.env.AUTH_SESSION_TTL_MS;
  if (!raw) {
    return DEFAULT_SESSION_TTL_MS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("AUTH_SESSION_TTL_MS must be a positive number");
  }

  return parsed;
}

export const SESSION_COOKIE_NAME = "airrand_session";
