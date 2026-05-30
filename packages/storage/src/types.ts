import type { Readable } from "node:stream";

export type StorageObjectRef = {
  key: string;
};

export type UploadObjectInput = {
  key: string;
  body: string | Buffer | Uint8Array;
  contentType?: string;
};

export type StorageReadinessResult = {
  ok: boolean;
  detail?: string;
};

export interface StorageProvider {
  uploadObject(input: UploadObjectInput): Promise<StorageObjectRef>;
  getObjectStream(ref: StorageObjectRef): Promise<Readable>;
  deleteObject(ref: StorageObjectRef): Promise<void>;
  objectExists(ref: StorageObjectRef): Promise<boolean>;
  checkReadiness(): Promise<StorageReadinessResult>;
}
