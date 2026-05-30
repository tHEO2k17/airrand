export type MinioStorageConfig = {
  provider: "minio";
  endpoint: string;
  port: number;
  useSsl: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  autoCreateBucket: boolean;
};

export type StorageConfig = MinioStorageConfig;

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return defaultValue;
}

export function parseStorageConfig(
  env: NodeJS.ProcessEnv = process.env,
): StorageConfig {
  const provider = env.STORAGE_PROVIDER?.trim().toLowerCase();
  if (!provider || provider === "none") {
    throw new Error("STORAGE_PROVIDER is required (use minio for local/staging)");
  }

  if (provider !== "minio") {
    throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }

  const endpoint = env.STORAGE_ENDPOINT?.trim();
  const accessKey = env.STORAGE_ACCESS_KEY?.trim();
  const secretKey = env.STORAGE_SECRET_KEY?.trim();
  const bucket = env.STORAGE_BUCKET?.trim();
  const portRaw = env.STORAGE_PORT?.trim();

  if (!endpoint) {
    throw new Error("STORAGE_ENDPOINT is required");
  }
  if (!accessKey || !secretKey) {
    throw new Error("STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY are required");
  }
  if (!bucket) {
    throw new Error("STORAGE_BUCKET is required");
  }

  const port = portRaw ? Number(portRaw) : 9000;
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("STORAGE_PORT must be a positive number");
  }

  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
  const autoCreateDefault = nodeEnv !== "production";

  return {
    provider: "minio",
    endpoint,
    port,
    useSsl: parseBoolean(env.STORAGE_USE_SSL, false),
    accessKey,
    secretKey,
    bucket,
    autoCreateBucket: parseBoolean(env.STORAGE_AUTO_CREATE_BUCKET, autoCreateDefault),
  };
}

export function buildMinioEndpointUrl(config: MinioStorageConfig): string {
  const protocol = config.useSsl ? "https" : "http";
  return `${protocol}://${config.endpoint}:${config.port}`;
}
