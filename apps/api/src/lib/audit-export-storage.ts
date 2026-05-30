import path from "node:path";
import {
  assertSafeRelativeExportPath,
  getExportStorageDir,
} from "@airrand/domain";

export function getApiExportStorageDir(): string {
  return getExportStorageDir();
}

export function resolveExportAbsolutePath(
  storageDir: string,
  relativeFilePath: string,
): string {
  assertSafeRelativeExportPath(relativeFilePath);
  const root = path.resolve(storageDir);
  const absolute = path.resolve(root, relativeFilePath);
  const relative = path.relative(root, absolute);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid export file path");
  }

  return absolute;
}
