import { describe, expect, it } from "vitest";
import { buildMinioEndpointUrl, parseStorageConfig } from "./config.js";

describe("parseStorageConfig", () => {
  it("parses MinIO settings from env", () => {
    const config = parseStorageConfig({
      STORAGE_PROVIDER: "minio",
      STORAGE_ENDPOINT: "localhost",
      STORAGE_PORT: "9000",
      STORAGE_USE_SSL: "false",
      STORAGE_ACCESS_KEY: "minioadmin",
      STORAGE_SECRET_KEY: "minioadmin",
      STORAGE_BUCKET: "airrand-exports",
      NODE_ENV: "development",
    });

    expect(config).toMatchObject({
      provider: "minio",
      endpoint: "localhost",
      port: 9000,
      useSsl: false,
      bucket: "airrand-exports",
      autoCreateBucket: true,
    });
  });

  it("disables auto bucket creation in production by default", () => {
    const config = parseStorageConfig({
      STORAGE_PROVIDER: "minio",
      STORAGE_ENDPOINT: "localhost",
      STORAGE_ACCESS_KEY: "a",
      STORAGE_SECRET_KEY: "b",
      STORAGE_BUCKET: "bucket",
      NODE_ENV: "production",
    });

    expect(config.autoCreateBucket).toBe(false);
  });
});

describe("buildMinioEndpointUrl", () => {
  it("builds http endpoint URL", () => {
    expect(
      buildMinioEndpointUrl({
        provider: "minio",
        endpoint: "localhost",
        port: 9000,
        useSsl: false,
        accessKey: "a",
        secretKey: "b",
        bucket: "x",
        autoCreateBucket: true,
      }),
    ).toBe("http://localhost:9000");
  });
});
