import { parseStorageConfig } from "./config.js";
import { MinioStorageProvider } from "./minio-provider.js";
import type { StorageProvider } from "./types.js";

export async function createStorageProvider(
  env: NodeJS.ProcessEnv = process.env,
): Promise<StorageProvider> {
  const config = parseStorageConfig(env);

  if (config.provider === "minio") {
    const provider = new MinioStorageProvider(config);
    await provider.ensureBucket();
    return provider;
  }

  throw new Error(`Unsupported storage provider: ${config.provider}`);
}
