import { pgEnum } from "drizzle-orm/pg-core";

export const merchantUserRoleEnum = pgEnum("merchant_user_role", [
  "owner",
  "manager",
  "staff",
]);

export type MerchantUserRole = (typeof merchantUserRoleEnum.enumValues)[number];
