import { describe, expect, it } from "vitest";
import { generateTemporaryPassword } from "./merchant-onboarding.js";

describe("generateTemporaryPassword", () => {
  it("returns a sufficiently long password", () => {
    const password = generateTemporaryPassword();
    expect(password.length).toBeGreaterThanOrEqual(12);
    expect(password.startsWith("Tmp-")).toBe(true);
  });
});
