import { config } from "dotenv";
import { eq } from "drizzle-orm";
import path from "node:path";
import { createDb } from "./client.js";
import { merchantUsers, merchants, products } from "./schema/index.js";

config({ path: path.resolve(process.cwd(), "../../.env") });
config();

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/airrand";

const SEED_MERCHANT_SLUG = "demo-cafe";

async function seed() {
  const db = createDb(connectionString);

  const existing = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.slug, SEED_MERCHANT_SLUG))
    .limit(1);

  if (existing.length > 0) {
    console.log("Seed merchant already exists, skipping.");
    return;
  }

  const [merchant] = await db
    .insert(merchants)
    .values({
      name: "Demo Cafe",
      slug: SEED_MERCHANT_SLUG,
    })
    .returning();

  if (!merchant) {
    throw new Error("Failed to create seed merchant");
  }

  await db.insert(merchantUsers).values({
    merchantId: merchant.id,
    email: "owner@demo-cafe.local",
    displayName: "Demo Owner",
  });

  await db.insert(products).values([
    {
      merchantId: merchant.id,
      name: "Espresso",
      description: "Single shot",
      unitPriceCents: 350,
      isAvailable: true,
    },
    {
      merchantId: merchant.id,
      name: "Croissant",
      description: "Butter croissant",
      unitPriceCents: 450,
      isAvailable: true,
    },
    {
      merchantId: merchant.id,
      name: "Cold Brew",
      description: "12oz iced",
      unitPriceCents: 500,
      isAvailable: true,
    },
  ]);

  console.log(`Seeded merchant ${merchant.id} (${SEED_MERCHANT_SLUG}) with products.`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
