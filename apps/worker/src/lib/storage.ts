import { createStorageProvider, type StorageProvider } from "@airrand/storage";

let storageProviderPromise: Promise<StorageProvider> | null = null;

export function getStorageProvider(): Promise<StorageProvider> {
  if (!storageProviderPromise) {
    storageProviderPromise = createStorageProvider();
  }
  return storageProviderPromise;
}

export async function verifyStorageReachable(): Promise<void> {
  const provider = await getStorageProvider();
  const result = await provider.checkReadiness();
  if (!result.ok) {
    throw new Error(result.detail ?? "Storage is not reachable");
  }
}
