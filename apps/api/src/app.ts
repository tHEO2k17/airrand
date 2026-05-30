import { Hono } from "hono";
import { cors } from "hono/cors";
import { merchantsRoutes } from "./routes/merchants.js";
import { jsonOk } from "./lib/response.js";

export const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3001",
      process.env.MERCHANT_APP_URL ?? "",
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
