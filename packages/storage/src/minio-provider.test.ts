import { describe, expect, it, vi, beforeEach } from "vitest";
import { Readable } from "node:stream";
import { MinioStorageProvider } from "./minio-provider.js";

const send = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = send;
  }
  return {
    S3Client,
    PutObjectCommand: class PutObjectCommand {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    GetObjectCommand: class GetObjectCommand {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    HeadObjectCommand: class HeadObjectCommand {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    HeadBucketCommand: class HeadBucketCommand {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    DeleteObjectCommand: class DeleteObjectCommand {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    CreateBucketCommand: class CreateBucketCommand {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    NotFound: class NotFound extends Error {
      name = "NotFound";
    },
  };
});

const baseConfig = {
  provider: "minio" as const,
  endpoint: "localhost",
  port: 9000,
  useSsl: false,
  accessKey: "minioadmin",
  secretKey: "minioadmin",
  bucket: "airrand-exports",
  autoCreateBucket: false,
};

describe("MinioStorageProvider", () => {
  beforeEach(() => {
    send.mockReset();
  });

  it("uploads objects with content type", async () => {
    const provider = new MinioStorageProvider(baseConfig);
    send.mockResolvedValueOnce({});

    const ref = await provider.uploadObject({
      key: "audit-exports/m/job.csv",
      body: "a,b",
      contentType: "text/csv",
    });

    expect(ref).toEqual({ key: "audit-exports/m/job.csv" });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("returns readable stream from getObjectStream", async () => {
    const provider = new MinioStorageProvider(baseConfig);
    const stream = Readable.from(["csv"]);
    send.mockResolvedValueOnce({ Body: stream });

    const result = await provider.getObjectStream({ key: "audit-exports/m/job.csv" });
    expect(result).toBe(stream);
  });

  it("reports objectExists false on NotFound", async () => {
    const provider = new MinioStorageProvider(baseConfig);
    const { NotFound } = await import("@aws-sdk/client-s3");
    send.mockRejectedValueOnce(new NotFound({ message: "missing", $metadata: {} }));

    await expect(provider.objectExists({ key: "missing.csv" })).resolves.toBe(false);
  });

  it("checkReadiness succeeds when bucket is reachable", async () => {
    const provider = new MinioStorageProvider(baseConfig);
    send.mockResolvedValueOnce({});

    await expect(provider.checkReadiness()).resolves.toEqual({ ok: true });
  });
});
