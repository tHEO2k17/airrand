import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("ChangeMe123!");
    await expect(verifyPassword("ChangeMe123!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("ChangeMe123!");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
