import { config } from "dotenv";
import { serve } from "@hono/node-server";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "./app.js";

const rootEnv = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.env",
);
config({ path: rootEnv });
config();

const port = Number(process.env.PORT ?? 3003);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
