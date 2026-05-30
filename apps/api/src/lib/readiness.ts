import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { validateRequiredSecrets } from "./config-validation.js";

export interface ReadinessCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface ReadinessResult {
  ready: boolean;
  checks: ReadinessCheck[];
}

export async function checkDatabaseConnectivity(): Promise<ReadinessCheck> {
  try {
    await db.execute(sql`SELECT 1`);
    return { name: "database", ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return { name: "database", ok: false, detail: message };
  }
}

export function checkRequiredSecrets(): ReadinessCheck {
  const result = validateRequiredSecrets();
  return {
    name: "secrets",
    ok: result.valid,
    detail: result.valid ? undefined : result.issues.join("; "),
  };
}

export async function getReadinessResult(): Promise<ReadinessResult> {
  const checks = [checkRequiredSecrets(), await checkDatabaseConnectivity()];
  return {
    ready: checks.every((check) => check.ok),
    checks,
  };
}
