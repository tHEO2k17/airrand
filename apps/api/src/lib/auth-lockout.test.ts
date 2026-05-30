import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthLockoutKey,
  checkAccountLocked,
  clearLoginAttempts,
  recordFailedLogin,
  resetAuthLockoutForTests,
} from "./auth-lockout.js";

describe("auth lockout (memory fallback)", () => {
  const email = "staff@demo-cafe.test";
  const ip = "203.0.113.10";
  const now = 1_700_000_000_000;

  beforeEach(() => {
    resetAuthLockoutForTests();
    vi.stubEnv("REDIS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetAuthLockoutForTests();
  });

  it("builds a stable key for email and IP", () => {
    expect(buildAuthLockoutKey("Staff@Demo.test", "203.0.113.10")).toBe(
      "staff@demo.test|203.0.113.10",
    );
  });

  it("locks after the configured number of failures", async () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await recordFailedLogin(email, ip, now + attempt);
      expect(result.locked).toBe(false);
      expect(result.backend).toBe("memory");
    }

    const final = await recordFailedLogin(email, ip, now + 5);
    expect(final.locked).toBe(true);

    const check = await checkAccountLocked(email, ip, now + 6);
    expect(check.locked).toBe(true);
  });

  it("clears lockout counters after successful login flow", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await recordFailedLogin(email, ip, now + attempt);
    }

    expect((await checkAccountLocked(email, ip, now + 10)).locked).toBe(true);

    await clearLoginAttempts(email, ip, now + 10);
    expect((await checkAccountLocked(email, ip, now + 11)).locked).toBe(false);
  });

  it("expires lockout after the lock duration", async () => {
    vi.stubEnv("AUTH_MAX_FAILED_ATTEMPTS", "3");
    vi.stubEnv("AUTH_LOCKOUT_WINDOW_MS", "60000");
    vi.stubEnv("AUTH_LOCKOUT_DURATION_MS", "1000");
    vi.stubEnv("REDIS_URL", "");
    vi.resetModules();

    const lockout = await import("./auth-lockout.js");
    lockout.resetAuthLockoutForTests();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await lockout.recordFailedLogin(email, ip, now + attempt);
    }

    expect((await lockout.checkAccountLocked(email, ip, now + 500)).locked).toBe(
      true,
    );
    expect(
      (await lockout.checkAccountLocked(email, ip, now + 1500)).locked,
    ).toBe(false);
  });
});
