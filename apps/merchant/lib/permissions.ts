import {
  merchantRoleCan,
  type MerchantPermissionAction,
  type MerchantStaffRole,
} from "@airrand/domain";
import type { MerchantStaffRole as ContractMerchantStaffRole } from "@airrand/contracts";
import { ApiError } from "./api";

export { merchantRoleCan, type MerchantPermissionAction };

export function roleCan(
  role: ContractMerchantStaffRole | null | undefined,
  action: MerchantPermissionAction,
): boolean {
  if (!role) {
    return false;
  }
  return merchantRoleCan(role as MerchantStaffRole, action);
}

export function formatRoleLabel(role: ContractMerchantStaffRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function isForbiddenApiError(error: unknown): boolean {
  return error instanceof ApiError && error.code.toLowerCase() === "forbidden";
}
