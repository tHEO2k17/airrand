import { merchants, type Database, type Merchant } from "@airrand/database";
import { normalizeMerchantSlug } from "@airrand/domain";
import { asc, eq } from "drizzle-orm";
import { db } from "../lib/db.js";

export type MerchantsRepository = {
  listOrderedByName: () => Promise<Merchant[]>;
  findById: (merchantId: string) => Promise<Merchant | null>;
  findBySlug: (slugInput: string) => Promise<Merchant | null>;
};

export function createMerchantsRepository(database: Database = db): MerchantsRepository {
  return {
    async listOrderedByName() {
      return database.select().from(merchants).orderBy(asc(merchants.name));
    },

    async findById(merchantId: string) {
      const [merchant] = await database
        .select()
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .limit(1);
      return merchant ?? null;
    },

    async findBySlug(slugInput: string) {
      const slug = normalizeMerchantSlug(slugInput);
      const [merchant] = await database
        .select()
        .from(merchants)
        .where(eq(merchants.slug, slug))
        .limit(1);
      return merchant ?? null;
    },
  };
}

export const merchantsRepository = createMerchantsRepository();
