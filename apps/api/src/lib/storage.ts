import { createStorageProvider, type StorageProvider } from "@airrand/storage";

let storageProviderPromise: Promise<StorageProvider> | null = null;

export function getStorageProvider(): Promise<StorageProvider> {
  if (!storageProviderPromise) {
    storageProviderPromise = createStorageProvider();
  }
  return storageProviderPromise;
}
