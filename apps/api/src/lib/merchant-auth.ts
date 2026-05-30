import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { verifySessionToken, type SessionTokenPayload } from "@airrand/auth";
import { getAuthSessionSecret, SESSION_COOKIE_NAME } from "./auth-env.js";

export type MerchantAuthContext = SessionTokenPayload;

export function extractSessionToken(c: Context): string | null {
  const authorization = c.req.header("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token) {
      return token;
    }
  }

  const cookieToken = getCookie(c, SESSION_COOKIE_NAME);
  return cookieToken ?? null;
}

export function verifyMerchantSessionToken(token: string): MerchantAuthContext {
  return verifySessionToken({
    token,
    secret: getAuthSessionSecret(),
  });
}

export function getMerchantAuth(c: Context): MerchantAuthContext | null {
  return c.get("merchantAuth") ?? null;
}

export function getMerchantActor(c: Context): {
  actorType: "merchant_staff";
  actorLabel: string;
} {
  const auth = getMerchantAuth(c);
  return {
    actorType: "merchant_staff",
    actorLabel: auth?.email ?? "unknown",
  };
}
