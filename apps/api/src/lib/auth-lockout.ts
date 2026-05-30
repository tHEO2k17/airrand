import {
  connectRedisClient,
  getRedisClient,
  type RedisCommandClient,
} from "./redis-client.js";
import {
  parseAuthLockoutConfig,
  type AuthLockoutConfig,
} from "./auth-lockout-config.js";

export type AuthLockoutBackend = "redis" | "memory";

export interface AuthLockoutCheckResult {
  locked: boolean;
  backend: AuthLockoutBackend;
}

export interface RecordFailedLoginResult {
  locked: boolean;
  failureCount: number;
  backend: AuthLockoutBackend;
}

type MemoryEntry = {
  failureCount: number;
  windowStartedAt: number;
  lockedUntil?: number;
};

let fallbackWarned = false;
const memoryStore = new Map<string, MemoryEntry>();
const config = parseAuthLockoutConfig();

function logFallback(reason: string): void {
  if (fallbackWarned) {
    return;
  }
  fallbackWarned = true;
  console.warn(
    JSON.stringify({
      level: "warn",
      type: "auth_lockout_fallback",
      message:
        "Redis unavailable or not configured; using in-memory auth lockout per API process",
      reason,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function buildAuthLockoutKey(email: string, clientIp: string): string {
  return `${email.trim().toLowerCase()}|${clientIp}`;
}

function failureRedisKey(lockoutKey: string, windowId: number): string {
  return `airrand:auth:fail:${lockoutKey}:${windowId}`;
}

function lockRedisKey(lockoutKey: string): string {
  return `airrand:auth:lock:${lockoutKey}`;
}

function getFailureWindowId(nowMs: number, windowMs: number): number {
  return Math.floor(nowMs / windowMs);
}

async function getConnectedRedis(): Promise<RedisCommandClient | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    await connectRedisClient(client);
    await client.ping();
    return client;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redis connection failed";
    logFallback(message);
    return null;
  }
}

function getMemoryEntry(lockoutKey: string, nowMs: number): MemoryEntry {
  const existing = memoryStore.get(lockoutKey);
  if (!existing) {
    const created: MemoryEntry = {
      failureCount: 0,
      windowStartedAt: nowMs,
    };
    memoryStore.set(lockoutKey, created);
    return created;
  }

  if (
    existing.lockedUntil !== undefined &&
    existing.lockedUntil > nowMs
  ) {
    return existing;
  }

  if (existing.lockedUntil !== undefined && existing.lockedUntil <= nowMs) {
    memoryStore.delete(lockoutKey);
    const created: MemoryEntry = {
      failureCount: 0,
      windowStartedAt: nowMs,
    };
    memoryStore.set(lockoutKey, created);
    return created;
  }

  if (nowMs - existing.windowStartedAt >= config.lockoutWindowMs) {
    const reset: MemoryEntry = {
      failureCount: 0,
      windowStartedAt: nowMs,
    };
    memoryStore.set(lockoutKey, reset);
    return reset;
  }

  return existing;
}

async function checkMemoryLocked(
  lockoutKey: string,
  nowMs: number,
): Promise<boolean> {
  const entry = getMemoryEntry(lockoutKey, nowMs);
  return entry.lockedUntil !== undefined && entry.lockedUntil > nowMs;
}

async function recordMemoryFailure(
  lockoutKey: string,
  nowMs: number,
): Promise<RecordFailedLoginResult> {
  const entry = getMemoryEntry(lockoutKey, nowMs);
  entry.failureCount += 1;

  if (entry.failureCount >= config.maxFailedAttempts) {
    entry.lockedUntil = nowMs + config.lockoutDurationMs;
    memoryStore.set(lockoutKey, entry);
    return {
      locked: true,
      failureCount: entry.failureCount,
      backend: "memory",
    };
  }

  memoryStore.set(lockoutKey, entry);
  return {
    locked: false,
    failureCount: entry.failureCount,
    backend: "memory",
  };
}

async function clearMemoryAttempts(lockoutKey: string): Promise<void> {
  memoryStore.delete(lockoutKey);
}

async function checkRedisLocked(
  redis: RedisCommandClient,
  lockoutKey: string,
): Promise<boolean> {
  const value = await redis.get(lockRedisKey(lockoutKey));
  return value !== null;
}

async function recordRedisFailure(
  redis: RedisCommandClient,
  lockoutKey: string,
  nowMs: number,
): Promise<RecordFailedLoginResult> {
  const windowId = getFailureWindowId(nowMs, config.lockoutWindowMs);
  const failKey = failureRedisKey(lockoutKey, windowId);
  const count = await redis.incr(failKey);
  if (count === 1) {
    await redis.pexpire(failKey, config.lockoutWindowMs);
  }

  if (count >= config.maxFailedAttempts) {
    const lockKey = lockRedisKey(lockoutKey);
    await redis.set(lockKey, "1", "PX", config.lockoutDurationMs);
    return { locked: true, failureCount: count, backend: "redis" };
  }

  return { locked: false, failureCount: count, backend: "redis" };
}

async function clearRedisAttempts(
  redis: RedisCommandClient,
  lockoutKey: string,
  nowMs: number,
): Promise<void> {
  const windowId = getFailureWindowId(nowMs, config.lockoutWindowMs);
  await redis.del(lockRedisKey(lockoutKey), failureRedisKey(lockoutKey, windowId));
}

export async function checkAccountLocked(
  email: string,
  clientIp: string,
  nowMs: number = Date.now(),
): Promise<AuthLockoutCheckResult> {
  const lockoutKey = buildAuthLockoutKey(email, clientIp);
  const redis = await getConnectedRedis();

  if (redis) {
    try {
      const locked = await checkRedisLocked(redis, lockoutKey);
      return { locked, backend: "redis" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Redis lockout check failed";
      logFallback(message);
    }
  }

  const locked = await checkMemoryLocked(lockoutKey, nowMs);
  return { locked, backend: "memory" };
}

export async function recordFailedLogin(
  email: string,
  clientIp: string,
  nowMs: number = Date.now(),
): Promise<RecordFailedLoginResult> {
  const lockoutKey = buildAuthLockoutKey(email, clientIp);
  const redis = await getConnectedRedis();

  if (redis) {
    try {
      const locked = await checkRedisLocked(redis, lockoutKey);
      if (locked) {
        return {
          locked: true,
          failureCount: config.maxFailedAttempts,
          backend: "redis",
        };
      }
      return await recordRedisFailure(redis, lockoutKey, nowMs);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Redis lockout record failed";
      logFallback(message);
    }
  }

  const alreadyLocked = await checkMemoryLocked(lockoutKey, nowMs);
  if (alreadyLocked) {
    return {
      locked: true,
      failureCount: config.maxFailedAttempts,
      backend: "memory",
    };
  }

  return recordMemoryFailure(lockoutKey, nowMs);
}

export async function clearLoginAttempts(
  email: string,
  clientIp: string,
  nowMs: number = Date.now(),
): Promise<void> {
  const lockoutKey = buildAuthLockoutKey(email, clientIp);
  const redis = await getConnectedRedis();

  if (redis) {
    try {
      await clearRedisAttempts(redis, lockoutKey, nowMs);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Redis lockout clear failed";
      logFallback(message);
    }
  }

  await clearMemoryAttempts(lockoutKey);
}

/** @internal Test-only reset */
export function resetAuthLockoutForTests(): void {
  memoryStore.clear();
  fallbackWarned = false;
}

/** @internal Test-only config override */
export function getAuthLockoutConfigForTests(): AuthLockoutConfig {
  return config;
}
