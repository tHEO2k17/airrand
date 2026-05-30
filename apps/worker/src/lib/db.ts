import { createDb, type Database } from "@airrand/database";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for audit export worker");
  }
  return url;
}

export const db: Database = createDb(getDatabaseUrl());
