import { describe, expect, it } from "vitest";
import { SessionTokenError } from "@airrand/auth";
import { assertSessionVersionMatches } from "./merchant-session.js";

describe("assertSessionVersionMatches", () => {
  it("allows matching versions", () => {
    expect(() => assertSessionVersionMatches(2, 2)).not.toThrow();
  });

  it("rejects stale token versions", () => {
    expect(() => assertSessionVersionMatches(1, 2)).toThrow(SessionTokenError);
    try {
      assertSessionVersionMatches(1, 2);
    } catch (error) {
      expect(error).toBeInstanceOf(SessionTokenError);
      expect((error as SessionTokenError).code).toBe("SESSION_REVOKED");
    }
  });
});
