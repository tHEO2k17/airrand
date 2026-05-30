import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createSessionToken } from "@airrand/auth";
import { requireMerchantAuth } from "./merchant-auth.js";

const SECRET = "test-session-secret-at-least-32-characters-long";

describe("requireMerchantAuth", () => {
  it("rejects requests when merchantId does not match session", async () => {
    process.env.AUTH_SESSION_SECRET = SECRET;

    const { token } = createSessionToken({
      merchantUserId: "user-1",
      merchantId: "merchant-a",
      role: "owner",
      email: "owner@demo-cafe.test",
      secret: SECRET,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    const app = new Hono();
    app.get(
      "/merchants/:merchantId/orders",
      requireMerchantAuth(),
      (c) => c.json({ ok: true }),
    );

    const res = await app.request("/merchants/merchant-b/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as {
      error: { code: string };
    };
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
