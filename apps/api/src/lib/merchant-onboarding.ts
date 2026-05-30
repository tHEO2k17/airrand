import { randomBytes } from "node:crypto";
import type { MerchantOnboardRequest } from "@airrand/contracts";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { hashPassword } from "@airrand/auth";
import { merchantUsers, merchants } from "@airrand/database";
import { validateMerchantOnboardInput } from "@airrand/domain";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { findMerchantBySlug } from "./merchant-lookup.js";

export function generateTemporaryPassword(): string {
  return `Tmp-${randomBytes(9).toString("base64url")}!`;
}

export async function isMerchantSlugTaken(
  slugInput: string,
  excludeMerchantId?: string,
): Promise<boolean> {
  const existing = await findMerchantBySlug(slugInput);
  if (!existing) {
    return false;
  }
  if (excludeMerchantId && existing.id === excludeMerchantId) {
    return false;
  }
  return true;
}

export type OnboardMerchantResult =
  | {
      ok: true;
      merchant: typeof merchants.$inferSelect;
      owner: typeof merchantUsers.$inferSelect;
      temporaryPassword: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
      status: ContentfulStatusCode;
      field?: "merchantName" | "slug" | "ownerEmail";
    };

export async function onboardMerchant(
  input: MerchantOnboardRequest,
): Promise<OnboardMerchantResult> {
  const validation = validateMerchantOnboardInput({
    merchantName: input.merchantName,
    slug: input.slug,
    ownerEmail: input.ownerEmail,
  });

  if (!validation.ok) {
    const first = validation.errors[0]!;
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: first.message,
      status: 400,
      field: first.field,
    };
  }

  if (await isMerchantSlugTaken(validation.slug)) {
    return {
      ok: false,
      code: "SLUG_IN_USE",
      message: "A merchant with this slug already exists.",
      status: 409,
      field: "slug",
    };
  }

  const [existingEmail] = await db
    .select({ id: merchantUsers.id })
    .from(merchantUsers)
    .where(eq(merchantUsers.email, validation.ownerEmail))
    .limit(1);

  if (existingEmail) {
    return {
      ok: false,
      code: "EMAIL_IN_USE",
      message: "A user with this email already exists.",
      status: 409,
      field: "ownerEmail",
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const now = new Date();
  const description =
    input.description === undefined
      ? null
      : input.description === null
        ? null
        : input.description.trim() || null;

  const [merchant] = await db
    .insert(merchants)
    .values({
      name: input.merchantName.trim(),
      slug: validation.slug,
      description,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!merchant) {
    return {
      ok: false,
      code: "CREATE_FAILED",
      message: "Failed to create merchant.",
      status: 500,
    };
  }

  const [owner] = await db
    .insert(merchantUsers)
    .values({
      merchantId: merchant.id,
      email: validation.ownerEmail,
      displayName: input.ownerDisplayName?.trim() ?? null,
      passwordHash,
      role: "owner",
      isActive: true,
      mustChangePassword: true,
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!owner) {
    await db.delete(merchants).where(eq(merchants.id, merchant.id));
    return {
      ok: false,
      code: "CREATE_FAILED",
      message: "Failed to create owner account.",
      status: 500,
    };
  }

  return { ok: true, merchant, owner, temporaryPassword };
}
