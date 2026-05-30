import { merchants } from "@airrand/database";
import { normalizeMerchantSlug } from "@airrand/domain";
import { eq } from "drizzle-orm";
import { db } from "./db.js";

export async function findMerchantById(merchantId: string) {
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);
  return merchant ?? null;
}

export async function findMerchantBySlug(slugInput: string) {
  const slug = normalizeMerchantSlug(slugInput);
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.slug, slug))
    .limit(1);
  return merchant ?? null;
}
