import type { MiddlewareHandler } from "hono";

export function requestLoggingMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now();
    await next();
    const durationMs = Date.now() - start;

    console.log(
      JSON.stringify({
        level: "info",
        type: "http_request",
        requestId: c.get("requestId"),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs,
        timestamp: new Date().toISOString(),
      }),
    );
  };
}
