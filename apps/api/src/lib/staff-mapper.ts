import type { StaffMemberResponse } from "@airrand/contracts";
import type { MerchantUser } from "@airrand/database";

const STAFF_RESPONSE_KEYS: (keyof StaffMemberResponse)[] = [
  "id",
  "merchantId",
  "email",
  "displayName",
  "role",
  "isActive",
  "lastLoginAt",
  "invitedAt",
  "deactivatedAt",
  "createdByMerchantUserId",
  "createdAt",
  "updatedAt",
];

export function toStaffMemberResponse(user: MerchantUser): StaffMemberResponse {
  const response: StaffMemberResponse = {
    id: user.id,
    merchantId: user.merchantId,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    invitedAt: user.invitedAt?.toISOString() ?? null,
    deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
    createdByMerchantUserId: user.createdByMerchantUserId ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return response;
}

export function staffResponseHasNoSensitiveFields(
  value: Record<string, unknown>,
): boolean {
  return !("passwordHash" in value) && !("password_hash" in value);
}

export function staffResponseOnlyUsesPublicKeys(
  value: Record<string, unknown>,
): boolean {
  const keys = Object.keys(value);
  return keys.every((key) =>
    STAFF_RESPONSE_KEYS.includes(key as keyof StaffMemberResponse),
  );
}
