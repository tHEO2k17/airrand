import { describe, expect, it } from "vitest";
import { decodePickupTokenForRouting } from "./decode-pickup-token.js";

describe("decodePickupTokenForRouting", () => {
  it("extracts orderId and merchantId from payload segment", () => {
    const payload = {
      orderId: "11111111-1111-4111-8111-111111111111",
      merchantId: "22222222-2222-4222-8222-222222222222",
      issuedAt: 1,
      expiresAt: 2,
      nonce: "abc",
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const token = `${payloadBase64}.fakesignature`;

    expect(decodePickupTokenForRouting(token)).toEqual({
      orderId: payload.orderId,
      merchantId: payload.merchantId,
    });
  });

  it("returns null for malformed tokens", () => {
    expect(decodePickupTokenForRouting("not-valid")).toBeNull();
  });
});
