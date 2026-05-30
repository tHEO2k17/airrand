import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCorsAllowedOrigins } from "./lib/cors.js";
import { getReadinessResult } from "./lib/readiness.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { requestLoggingMiddleware } from "./middleware/request-logging.js";
import { authRoutes } from "./routes/auth.js";
import { internalRoutes } from "./routes/internal.js";
import { merchantsRoutes } from "./routes/merchants.js";
import { jsonOk } from "./lib/response.js";

export const app = new Hono();

app.use("*", requestIdMiddleware());
app.use("*", requestLoggingMiddleware());
app.use("*", rateLimitMiddleware());

app.use(
  "*",
  cors({
    origin: getCorsAllowedOrigins(),
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Internal-Setup-Key",
    ],
    exposeHeaders: ["Set-Cookie", "X-Request-Id"],
  }),
);

app.get("/health", (c) =>
  jsonOk(c, {
    status: "ok",
    service: "airrand-api",
  }),
);

app.get("/ready", async (c) => {
  const result = await getReadinessResult();
  const payload = {
    status: result.ready ? "ready" : "not_ready",
    service: "airrand-api",
    checks: result.checks,
    ...(Object.keys(result.details).length > 0 ? { details: result.details } : {}),
  };

  if (!result.ready) {
    return c.json(
      {
        error: {
          code: "NOT_READY",
          message: "One or more readiness checks failed",
        },
        data: payload,
      },
      503,
    );
  }

  return jsonOk(c, payload);
});

app.route("/auth", authRoutes);
app.route("/internal", internalRoutes);
app.route("/merchants", merchantsRoutes);

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404),
);

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      level: "error",
      type: "unhandled_error",
      requestId: c.get("requestId"),
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }),
  );
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    500,
  );
});
