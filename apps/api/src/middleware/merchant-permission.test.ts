import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { createSessionToken } from "@airrand/auth";
import { requireMerchantAuth } from "./merchant-auth.js";
import { requireMerchantPermission } from "./merchant-permission.js";

const SECRET = "test-session-secret-at-least-32-characters-long";

vi.mock("../lib/db.js", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [
            {
              sessionVersion: 1,
              mustChangePassword: false,
              isActive: true,
            },
          ],
        }),
      }),
    }),
  },
}));

function staffToken(merchantId: string) {
  return createSessionToken({
    merchantUserId: "staff-user-1",
    merchantId,
    role: "staff",
    email: "staff@demo-cafe.test",
    sessionVersion: 1,
    secret: SECRET,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
  }).token;
}

describe("requireMerchantPermission", () => {
  it("returns forbidden when staff lacks permission", async () => {
    process.env.AUTH_SESSION_SECRET = SECRET;

    const merchantId = "merchant-a";
    const app = new Hono();
    app.post(
      "/merchants/:merchantId/products",
      requireMerchantAuth(),
      requireMerchantPermission("product:create"),
      (c) => c.json({ ok: true }),
    );

    const res = await app.request(`/merchants/${merchantId}/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${staffToken(merchantId)}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("forbidden");
    expect(body.error.message).toBe(
      "You do not have permission to perform this action.",
    );
  });
});
