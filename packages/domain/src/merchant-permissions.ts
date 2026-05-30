export type MerchantStaffRole = "owner" | "manager" | "staff";

export const MERCHANT_PERMISSION_ACTIONS = [
  "product:create",
  "product:update",
  "order:view",
  "order:update_status",
  "pickup:verify",
  "audit_log:view",
  "staff:view",
  "staff:create",
  "staff:update_role",
  "staff:deactivate",
] as const;

export type MerchantPermissionAction =
  (typeof MERCHANT_PERMISSION_ACTIONS)[number];

const STAFF_ALLOWED_ACTIONS: ReadonlySet<MerchantPermissionAction> = new Set([
  "order:view",
  "order:update_status",
  "pickup:verify",
]);

const MANAGER_DENIED_ACTIONS: ReadonlySet<MerchantPermissionAction> = new Set([
  "staff:update_role",
  "staff:deactivate",
]);

export function merchantRoleCan(
  role: MerchantStaffRole,
  action: MerchantPermissionAction,
): boolean {
  if (role === "staff") {
    return STAFF_ALLOWED_ACTIONS.has(action);
  }

  if (role === "manager") {
    return !MANAGER_DENIED_ACTIONS.has(action);
  }

  return true;
}
