import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { validateRequiredSecrets } from "./config-validation.js";
import { getRedisUrl, pingRedis, getRedisClient } from "./redis-client.js";

export type ReadinessCheckStatus = "ok" | "failed" | "skipped";

export interface ReadinessChecksMap {
  database: ReadinessCheckStatus;
  redis: ReadinessCheckStatus;
  secrets: ReadinessCheckStatus;
}

export interface ReadinessResult {
  ready: boolean;
  checks: ReadinessChecksMap;
  details: Partial<Record<keyof ReadinessChecksMap, string>>;
}

export async function checkDatabaseConnectivity(): Promise<{
  status: ReadinessCheckStatus;
  detail?: string;
}> {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "ok" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return { status: "failed", detail: message };
  }
}

export function checkRequiredSecretsReadiness(): {
  status: ReadinessCheckStatus;
  detail?: string;
} {
  const result = validateRequiredSecrets();
  return {
    status: result.valid ? "ok" : "failed",
    detail: result.valid ? undefined : result.issues.join("; "),
  };
}

export async function checkRedisConnectivity(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ status: ReadinessCheckStatus; detail?: string }> {
  const url = getRedisUrl(env);
  if (!url) {
    return { status: "skipped", detail: "REDIS_URL not configured" };
  }

  const client = getRedisClient(env);
  if (!client) {
    return { status: "failed", detail: "REDIS_URL is set but client failed to initialize" };
  }

  const ping = await pingRedis(client);
  return {
    status: ping.ok ? "ok" : "failed",
    detail: ping.detail,
  };
}

export function aggregateReadiness(
  database: ReadinessCheckStatus,
  redis: ReadinessCheckStatus,
  secrets: ReadinessCheckStatus,
): boolean {
  if (secrets !== "ok" || database !== "ok") {
    return false;
  }

  if (redis === "failed") {
    return false;
  }

  return true;
}

export async function getReadinessResult(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ReadinessResult> {
  const databaseResult = await checkDatabaseConnectivity();
  const secretsResult = checkRequiredSecretsReadiness();
  const redisResult = await checkRedisConnectivity(env);

  const checks: ReadinessChecksMap = {
    database: databaseResult.status,
    redis: redisResult.status,
    secrets: secretsResult.status,
  };

  const details: ReadinessResult["details"] = {};
  if (databaseResult.detail) {
    details.database = databaseResult.detail;
  }
  if (redisResult.detail) {
    details.redis = redisResult.detail;
  }
  if (secretsResult.detail) {
    details.secrets = secretsResult.detail;
  }

  return {
    ready: aggregateReadiness(checks.database, checks.redis, checks.secrets),
    checks,
    details,
  };
}
