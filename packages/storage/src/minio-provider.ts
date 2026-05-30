import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import type { MinioStorageConfig } from "./config.js";
import { buildMinioEndpointUrl } from "./config.js";
import type {
  StorageObjectRef,
  StorageProvider,
  StorageReadinessResult,
  UploadObjectInput,
} from "./types.js";

function toBodyBuffer(body: UploadObjectInput["body"]): Buffer {
  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  return Buffer.from(body);
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof NotFound) {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "NotFound" || error.name === "NoSuchKey" || error.name === "NoSuchBucket")
  ) {
    return true;
  }
  return false;
}

export class MinioStorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly autoCreateBucket: boolean;

  constructor(config: MinioStorageConfig) {
    this.bucket = config.bucket;
    this.autoCreateBucket = config.autoCreateBucket;
    this.client = new S3Client({
      endpoint: buildMinioEndpointUrl(config),
      region: "us-east-1",
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });
  }

  async ensureBucket(): Promise<void> {
    if (!this.autoCreateBucket) {
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async uploadObject(input: UploadObjectInput): Promise<StorageObjectRef> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: toBodyBuffer(input.body),
        ContentType: input.contentType,
      }),
    );

    return { key: input.key };
  }

  async getObjectStream(ref: StorageObjectRef): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: ref.key,
      }),
    );

    if (!response.Body) {
      throw new Error("Object body is empty");
    }

    return response.Body as Readable;
  }

  async deleteObject(ref: StorageObjectRef): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: ref.key,
      }),
    );
  }

  async objectExists(ref: StorageObjectRef): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: ref.key,
        }),
      );
      return true;
    } catch (error) {
      if (isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  async checkReadiness(): Promise<StorageReadinessResult> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Storage check failed";
      return { ok: false, detail: message };
    }
  }
}
