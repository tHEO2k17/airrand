import { describe, expect, it } from "vitest";
import {
  staffResponseHasNoSensitiveFields,
  staffResponseOnlyUsesPublicKeys,
  toStaffMemberResponse,
} from "./staff-mapper.js";

describe("toStaffMemberResponse", () => {
  it("excludes password_hash from the mapped object", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const mapped = toStaffMemberResponse({
      id: "11111111-1111-1111-1111-111111111111",
      merchantId: "22222222-2222-2222-2222-222222222222",
      email: "staff@demo-cafe.test",
      displayName: "Staff User",
      passwordHash: "argon2id$secret",
      role: "staff",
      lastLoginAt: now,
      isActive: true,
      mustChangePassword: true,
      invitedAt: now,
      deactivatedAt: null,
      createdByMerchantUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    const record = mapped as Record<string, unknown>;
    expect(staffResponseHasNoSensitiveFields(record)).toBe(true);
    expect(staffResponseOnlyUsesPublicKeys(record)).toBe(true);
    expect(record.email).toBe("staff@demo-cafe.test");
  });
});
