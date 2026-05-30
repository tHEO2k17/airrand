import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { REQUEST_ID_HEADER, requestIdMiddleware } from "./request-id.js";

describe("requestIdMiddleware", () => {
  it("generates a request id and exposes it on the response", async () => {
    const app = new Hono();
    app.use("*", requestIdMiddleware());
    app.get("/ping", (c) => c.json({ requestId: c.get("requestId") }));

    const res = await app.request("/ping");
    const body = (await res.json()) as { requestId: string };
    const header = res.headers.get(REQUEST_ID_HEADER);

    expect(res.status).toBe(200);
    expect(body.requestId).toBeTruthy();
    expect(header).toBe(body.requestId);
  });

  it("propagates a valid incoming request id", async () => {
    const app = new Hono();
    app.use("*", requestIdMiddleware());
    app.get("/ping", (c) => c.json({ requestId: c.get("requestId") }));

    const incoming = "trace-abc-123";
    const res = await app.request("/ping", {
      headers: { [REQUEST_ID_HEADER]: incoming },
    });
    const body = (await res.json()) as { requestId: string };

    expect(body.requestId).toBe(incoming);
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(incoming);
  });
});
