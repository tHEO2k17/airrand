import { describe, expect, it } from "vitest";
import {
  canCreateStaffWithRole,
  canDeactivateMerchantUser,
  canReactivateMerchantUser,
  canResetStaffPassword,
  canUpdateStaffRole,
} from "./staff-lifecycle.js";

describe("canCreateStaffWithRole", () => {
  it("allows owner to create manager or staff", () => {
    expect(canCreateStaffWithRole("owner", "manager")).toBe(true);
    expect(canCreateStaffWithRole("owner", "staff")).toBe(true);
  });

  it("allows manager to create staff only", () => {
    expect(canCreateStaffWithRole("manager", "staff")).toBe(true);
    expect(canCreateStaffWithRole("manager", "manager")).toBe(false);
  });

  it("denies staff from creating users", () => {
    expect(canCreateStaffWithRole("staff", "staff")).toBe(false);
  });
});

describe("canDeactivateMerchantUser", () => {
  it("blocks self-deactivation", () => {
    const result = canDeactivateMerchantUser({
      actorUserId: "u1",
      targetUserId: "u1",
      targetRole: "manager",
      targetIsActive: true,
      activeOwnerCount: 1,
    });
    expect(result.allowed).toBe(false);
  });

  it("blocks deactivating the last active owner", () => {
    const result = canDeactivateMerchantUser({
      actorUserId: "u2",
      targetUserId: "u1",
      targetRole: "owner",
      targetIsActive: true,
      activeOwnerCount: 1,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/last active owner/i);
  });

  it("allows deactivating an owner when another active owner exists", () => {
    const result = canDeactivateMerchantUser({
      actorUserId: "u2",
      targetUserId: "u1",
      targetRole: "owner",
      targetIsActive: true,
      activeOwnerCount: 2,
    });
    expect(result.allowed).toBe(true);
  });
});

describe("canUpdateStaffRole", () => {
  it("blocks changing the last active owner", () => {
    const result = canUpdateStaffRole({
      targetRole: "owner",
      newRole: "manager",
      activeOwnerCount: 1,
    });
    expect(result.allowed).toBe(false);
  });

  it("allows updating a manager when multiple owners exist", () => {
    const result = canUpdateStaffRole({
      targetRole: "manager",
      newRole: "staff",
      activeOwnerCount: 2,
    });
    expect(result.allowed).toBe(true);
  });
});

describe("canReactivateMerchantUser", () => {
  it("blocks reactivating an active account", () => {
    expect(
      canReactivateMerchantUser({ targetIsActive: true }).allowed,
    ).toBe(false);
  });

  it("allows reactivating an inactive account", () => {
    expect(
      canReactivateMerchantUser({ targetIsActive: false }).allowed,
    ).toBe(true);
  });
});

describe("canResetStaffPassword", () => {
  it("blocks resetting your own password", () => {
    expect(
      canResetStaffPassword({
        actorUserId: "u1",
        targetUserId: "u1",
        targetIsActive: true,
      }).allowed,
    ).toBe(false);
  });

  it("blocks resetting password for inactive accounts", () => {
    expect(
      canResetStaffPassword({
        actorUserId: "u1",
        targetUserId: "u2",
        targetIsActive: false,
      }).allowed,
    ).toBe(false);
  });
});
