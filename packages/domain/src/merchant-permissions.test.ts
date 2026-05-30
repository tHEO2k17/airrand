import { describe, expect, it } from "vitest";
import {
  MERCHANT_PERMISSION_ACTIONS,
  merchantRoleCan,
} from "./merchant-permissions.js";

describe("merchantRoleCan", () => {
  const allActions = [...MERCHANT_PERMISSION_ACTIONS];

  it("allows owner every action", () => {
    for (const action of allActions) {
      expect(merchantRoleCan("owner", action)).toBe(true);
    }
  });

  it("allows manager all actions except owner-only staff lifecycle", () => {
    const ownerOnly: typeof allActions[number][] = [
      "staff:update_role",
      "staff:deactivate",
      "staff:reactivate",
      "staff:reset_password",
    ];
    for (const action of allActions) {
      expect(merchantRoleCan("manager", action)).toBe(!ownerOnly.includes(action));
    }
  });

  it("allows staff order and pickup actions only", () => {
    expect(merchantRoleCan("staff", "order:view")).toBe(true);
    expect(merchantRoleCan("staff", "order:update_status")).toBe(true);
    expect(merchantRoleCan("staff", "pickup:verify")).toBe(true);
  });

  it("denies staff catalog, audit, and staff management actions", () => {
    expect(merchantRoleCan("staff", "product:create")).toBe(false);
    expect(merchantRoleCan("staff", "product:update")).toBe(false);
    expect(merchantRoleCan("staff", "audit_log:view")).toBe(false);
    expect(merchantRoleCan("staff", "staff:view")).toBe(false);
    expect(merchantRoleCan("staff", "staff:create")).toBe(false);
  });
});
