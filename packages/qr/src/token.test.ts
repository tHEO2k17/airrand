import { describe, expect, it } from "vitest";
import {
  PickupTokenError,
  createPickupToken,
  verifyPickupToken,
} from "./token.js";

const SECRET = "test-signing-secret-min-32-characters";
const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const MERCHANT_ID = "22222222-2222-4222-8222-222222222222";
const NONCE = "abc123nonce456";
const ISSUED_AT = 1_700_000_000_000;
const EXPIRES_AT = ISSUED_AT + 60 * 60 * 1000;

function makeToken(overrides: Partial<Parameters<typeof createPickupToken>[0]> = {}) {
  return createPickupToken({
    orderId: ORDER_ID,
    merchantId: MERCHANT_ID,
    secret: SECRET,
    nonce: NONCE,
    issuedAt: ISSUED_AT,
    expiresAt: EXPIRES_AT,
    ...overrides,
  });
}

describe("createPickupToken / verifyPickupToken", () => {
  it("accepts a valid token", () => {
    const { token } = makeToken();
    const payload = verifyPickupToken({
      token,
      secret: SECRET,
      expectedMerchantId: MERCHANT_ID,
      expectedOrderId: ORDER_ID,
      now: ISSUED_AT + 1000,
    });

    expect(payload.nonce).toBe(NONCE);
    expect(payload.orderId).toBe(ORDER_ID);
    expect(payload.merchantId).toBe(MERCHANT_ID);
  });

  it("rejects an invalid signature", () => {
    const { token } = makeToken();
    const tampered = `${token.slice(0, -4)}xxxx`;

    try {
      verifyPickupToken({
        token: tampered,
        secret: SECRET,
        now: ISSUED_AT + 1000,
      });
      expect.fail("expected invalid signature");
    } catch (error) {
      expect(error).toBeInstanceOf(PickupTokenError);
      expect((error as PickupTokenError).code).toBe("INVALID_SIGNATURE");
    }
  });

  it("rejects an expired token", () => {
    const { token } = makeToken();

    try {
      verifyPickupToken({
        token,
        secret: SECRET,
        now: EXPIRES_AT + 1,
      });
      expect.fail("expected expired token");
    } catch (error) {
      expect(error).toBeInstanceOf(PickupTokenError);
      expect((error as PickupTokenError).code).toBe("EXPIRED_TOKEN");
    }
  });

  it("rejects wrong merchant", () => {
    const { token } = makeToken();

    try {
      verifyPickupToken({
        token,
        secret: SECRET,
        expectedMerchantId: "99999999-9999-4999-8999-999999999999",
        now: ISSUED_AT + 1000,
      });
      expect.fail("expected merchant mismatch");
    } catch (error) {
      expect(error).toBeInstanceOf(PickupTokenError);
      expect((error as PickupTokenError).code).toBe("MERCHANT_MISMATCH");
    }
  });

  it("rejects wrong order", () => {
    const { token } = makeToken();

    try {
      verifyPickupToken({
        token,
        secret: SECRET,
        expectedOrderId: "99999999-9999-4999-8999-999999999999",
        now: ISSUED_AT + 1000,
      });
      expect.fail("expected order mismatch");
    } catch (error) {
      expect(error).toBeInstanceOf(PickupTokenError);
      expect((error as PickupTokenError).code).toBe("ORDER_MISMATCH");
    }
  });

  it("rejects malformed token", () => {
    try {
      verifyPickupToken({
        token: "not-a-valid-token",
        secret: SECRET,
      });
      expect.fail("expected malformed token");
    } catch (error) {
      expect(error).toBeInstanceOf(PickupTokenError);
      expect((error as PickupTokenError).code).toBe("MALFORMED_TOKEN");
    }
  });
});
