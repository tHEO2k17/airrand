import type { MerchantStaffRole } from "@airrand/contracts";
import { useAuth } from "../components/auth-context";
import { roleCan } from "./permissions";

export function useMerchantPermissions() {
  const { user } = useAuth();
  const role = user?.role as MerchantStaffRole | undefined;

  return {
    role,
    canCreateProduct: roleCan(role, "product:create"),
    canUpdateProduct: roleCan(role, "product:update"),
    canViewAuditLogs: roleCan(role, "audit_log:view"),
    canViewStaff: roleCan(role, "staff:view"),
    canCreateStaff: roleCan(role, "staff:create"),
    canUpdateStaffRole: roleCan(role, "staff:update_role"),
    canDeactivateStaff: roleCan(role, "staff:deactivate"),
  };
}
