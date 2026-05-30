import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { merchantsRoutes } from "./routes/merchants.js";
import { jsonOk } from "./lib/response.js";

export const app = new Hono();

app.use("*", rateLimitMiddleware());

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:3002",
      process.env.MERCHANT_APP_URL ?? "",
      process.env.CUSTOMER_APP_URL ?? "",
    ].filter(Boolean),
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/health", (c) =>
  jsonOk(c, {
    status: "ok",
    service: "airrand-api",
  }),
);

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
