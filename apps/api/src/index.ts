import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "airrand-api",
  }),
);

const port = Number(process.env.PORT ?? 3003);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
