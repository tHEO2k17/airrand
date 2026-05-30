import { describe, expect, it } from "vitest";
import { getCorsAllowedOrigins } from "./cors.js";

describe("getCorsAllowedOrigins", () => {
  it("returns localhost defaults when env is unset", () => {
    expect(getCorsAllowedOrigins({})).toEqual([
      "http://localhost:3001",
      "http://localhost:3002",
    ]);
  });

  it("parses comma-separated origins", () => {
    expect(
      getCorsAllowedOrigins({
        CORS_ALLOWED_ORIGINS:
          "https://merchant.example.com, https://customer.example.com",
      }),
    ).toEqual([
      "https://merchant.example.com",
      "https://customer.example.com",
    ]);
  });
});
