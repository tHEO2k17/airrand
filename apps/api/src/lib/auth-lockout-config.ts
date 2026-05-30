export interface AuthLockoutConfig {
  maxFailedAttempts: number;
  lockoutWindowMs: number;
  lockoutDurationMs: number;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function parseAuthLockoutConfig(
  env: NodeJS.ProcessEnv = process.env,
): AuthLockoutConfig {
  return {
    maxFailedAttempts: parsePositiveInt(env.AUTH_MAX_FAILED_ATTEMPTS, 5),
    lockoutWindowMs: parsePositiveInt(env.AUTH_LOCKOUT_WINDOW_MS, 900_000),
    lockoutDurationMs: parsePositiveInt(env.AUTH_LOCKOUT_DURATION_MS, 900_000),
  };
}
