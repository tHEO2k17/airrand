import { afterEach, describe, expect, it } from "vitest";
import { validateRequiredSecrets } from "./config-validation.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("validateRequiredSecrets", () => {
  it("passes when secrets meet minimum length", () => {
    const result = validateRequiredSecrets({
      AUTH_SESSION_SECRET: "a".repeat(32),
      QR_SIGNING_SECRET: "b".repeat(32),
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("fails when secrets are missing or too short", () => {
    const result = validateRequiredSecrets({
      AUTH_SESSION_SECRET: "short",
      QR_SIGNING_SECRET: "",
    });

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
