import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function loadWorkerEnv(): void {
  const rootEnv = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../.env",
  );
  config({ path: rootEnv });
  config();
}
