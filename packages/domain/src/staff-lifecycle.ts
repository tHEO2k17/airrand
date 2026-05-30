import type { MerchantStaffRole } from "./merchant-permissions.js";

export type AssignableStaffRole = "manager" | "staff";

export function canCreateStaffWithRole(
  actorRole: MerchantStaffRole,
  requestedRole: AssignableStaffRole,
): boolean {
  if (actorRole === "owner") {
    return true;
  }

  if (actorRole === "manager") {
    return requestedRole === "staff";
  }

  return false;
}

export function canDeactivateMerchantUser(input: {
  actorUserId: string;
  targetUserId: string;
  targetRole: MerchantStaffRole;
  targetIsActive: boolean;
  activeOwnerCount: number;
}): { allowed: boolean; reason?: string } {
  if (input.actorUserId === input.targetUserId) {
    return { allowed: false, reason: "You cannot deactivate your own account." };
  }

  if (!input.targetIsActive) {
    return { allowed: false, reason: "This account is already inactive." };
  }

  if (input.targetRole === "owner" && input.activeOwnerCount <= 1) {
    return {
      allowed: false,
      reason: "Cannot deactivate the last active owner for this merchant.",
    };
  }

  return { allowed: true };
}

export function canUpdateStaffRole(input: {
  targetRole: MerchantStaffRole;
  newRole: AssignableStaffRole;
  activeOwnerCount: number;
}): { allowed: boolean; reason?: string } {
  if (input.targetRole === "owner" && input.activeOwnerCount <= 1) {
    return {
      allowed: false,
      reason: "Cannot change the role of the last active owner.",
    };
  }

  if (input.targetRole === "owner") {
    return {
      allowed: false,
      reason: "Owner role cannot be assigned or changed through staff management.",
    };
  }

  return { allowed: true };
}
