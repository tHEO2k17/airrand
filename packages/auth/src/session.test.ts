import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  SessionTokenError,
  verifySessionToken,
} from "./session.js";

const SECRET = "test-session-secret-at-least-32-characters-long";

describe("session token", () => {
  it("round-trips a valid token", () => {
    const { token } = createSessionToken({
      merchantUserId: "user-1",
      merchantId: "merchant-1",
      role: "owner",
      email: "owner@demo-cafe.test",
      secret: SECRET,
      issuedAt: 1_000,
      expiresAt: 9_000,
    });

    const payload = verifySessionToken({
      token,
      secret: SECRET,
      now: 5_000,
    });

    expect(payload.merchantUserId).toBe("user-1");
    expect(payload.merchantId).toBe("merchant-1");
    expect(payload.role).toBe("owner");
    expect(payload.email).toBe("owner@demo-cafe.test");
  });

  it("rejects expired tokens", () => {
    const { token } = createSessionToken({
      merchantUserId: "user-1",
      merchantId: "merchant-1",
      role: "owner",
      email: "owner@demo-cafe.test",
      secret: SECRET,
      issuedAt: 1_000,
      expiresAt: 2_000,
    });

    expect(() =>
      verifySessionToken({ token, secret: SECRET, now: 3_000 }),
    ).toThrow(SessionTokenError);
  });

  it("rejects tampered tokens", () => {
    const { token } = createSessionToken({
      merchantUserId: "user-1",
      merchantId: "merchant-1",
      role: "owner",
      email: "owner@demo-cafe.test",
      secret: SECRET,
      issuedAt: 1_000,
      expiresAt: 9_000,
    });

    const tampered = `${token}x`;

    expect(() =>
      verifySessionToken({ token: tampered, secret: SECRET, now: 5_000 }),
    ).toThrow(SessionTokenError);
  });
});
