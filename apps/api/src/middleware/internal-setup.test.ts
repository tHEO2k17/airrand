import { afterEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { requireInternalSetupKey } from "./internal-setup.js";

describe("requireInternalSetupKey", () => {
  const ORIGINAL = process.env.INTERNAL_SETUP_SECRET;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.INTERNAL_SETUP_SECRET;
    } else {
      process.env.INTERNAL_SETUP_SECRET = ORIGINAL;
    }
  });

  it("returns 503 when setup secret is not configured", async () => {
    delete process.env.INTERNAL_SETUP_SECRET;
    const app = new Hono();
    app.post("/test", requireInternalSetupKey(), (c) => c.json({ ok: true }));

    const res = await app.request("/test", { method: "POST" });
    expect(res.status).toBe(503);
  });

  it("returns 401 for invalid setup key", async () => {
    process.env.INTERNAL_SETUP_SECRET = "test-secret";
    const app = new Hono();
    app.post("/test", requireInternalSetupKey(), (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      method: "POST",
      headers: { "X-Internal-Setup-Key": "wrong" },
    });
    expect(res.status).toBe(401);
  });

  it("allows requests with the configured key", async () => {
    process.env.INTERNAL_SETUP_SECRET = "test-secret";
    const app = new Hono();
    app.post("/test", requireInternalSetupKey(), (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      method: "POST",
      headers: { "X-Internal-Setup-Key": "test-secret" },
    });
    expect(res.status).toBe(200);
  });
});
