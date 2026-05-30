import { parseStorageConfig } from "./config.js";
import { MinioStorageProvider } from "./minio-provider.js";
import type { StorageReadinessResult } from "./types.js";

export async function checkStorageReadiness(
  env: NodeJS.ProcessEnv = process.env,
): Promise<StorageReadinessResult> {
  try {
    const config = parseStorageConfig(env);
    if (config.provider === "minio") {
      const provider = new MinioStorageProvider(config);
      return provider.checkReadiness();
    }
    return { ok: false, detail: `Unsupported storage provider: ${config.provider}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage check failed";
    return { ok: false, detail: message };
  }
}
