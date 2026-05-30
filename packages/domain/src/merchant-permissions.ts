export type MerchantStaffRole = "owner" | "manager" | "staff";

export const MERCHANT_PERMISSION_ACTIONS = [
  "product:create",
  "product:update",
  "order:view",
  "order:update_status",
  "pickup:verify",
  "audit_log:view",
] as const;

export type MerchantPermissionAction =
  (typeof MERCHANT_PERMISSION_ACTIONS)[number];

const STAFF_ALLOWED_ACTIONS: ReadonlySet<MerchantPermissionAction> = new Set([
  "order:view",
  "order:update_status",
  "pickup:verify",
]);

export function merchantRoleCan(
  role: MerchantStaffRole,
  action: MerchantPermissionAction,
): boolean {
  if (role === "staff") {
    return STAFF_ALLOWED_ACTIONS.has(action);
  }

  return true;
}
