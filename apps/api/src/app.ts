import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCorsAllowedOrigins } from "./lib/cors.js";
import { getReadinessResult } from "./lib/readiness.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { authRoutes } from "./routes/auth.js";
import { merchantsRoutes } from "./routes/merchants.js";
import { jsonOk } from "./lib/response.js";

export const app = new Hono();

app.use("*", rateLimitMiddleware());

app.use(
  "*",
  cors({
    origin: getCorsAllowedOrigins(),
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Set-Cookie"],
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
  if (!result.ready) {
    return c.json(
      {
        error: {
          code: "NOT_READY",
          message: "One or more readiness checks failed",
        },
        data: { checks: result.checks },
      },
      503,
    );
  }

  return jsonOk(c, {
    status: "ready",
    service: "airrand-api",
    checks: result.checks,
  });
});

app.route("/auth", authRoutes);
app.route("/merchants", merchantsRoutes);

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404),
);

app.onError((error, c) => {
  console.error(error);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    500,
  );
});
