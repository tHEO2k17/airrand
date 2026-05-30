import { hashPassword } from "@airrand/auth";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import path from "node:path";
import { createDb } from "./client.js";
import { merchantUsers, merchants, products } from "./schema/index.js";

config({ path: path.resolve(process.cwd(), "../../.env") });
config();

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/airrand";

const SEED_MERCHANT_SLUG = "demo-cafe";

/** Local demo only — change before any real deployment. */
const DEMO_OWNER_EMAIL = "owner@demo-cafe.test";
const DEMO_OWNER_PASSWORD = "ChangeMe123!";

async function upsertDemoOwner(
  db: ReturnType<typeof createDb>,
  merchantId: string,
) {
  const passwordHash = await hashPassword(DEMO_OWNER_PASSWORD);

  const [existingUser] = await db
    .select({ id: merchantUsers.id })
    .from(merchantUsers)
    .where(eq(merchantUsers.email, DEMO_OWNER_EMAIL))
    .limit(1);

  if (existingUser) {
    await db
      .update(merchantUsers)
      .set({
        passwordHash,
        role: "owner",
        displayName: "Demo Owner",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(merchantUsers.id, existingUser.id));
    console.log(`Updated demo owner ${DEMO_OWNER_EMAIL} (password: ${DEMO_OWNER_PASSWORD}).`);
    return;
  }

  await db.insert(merchantUsers).values({
    merchantId,
    email: DEMO_OWNER_EMAIL,
    displayName: "Demo Owner",
    passwordHash,
    role: "owner",
    isActive: true,
  });

  console.log(`Created demo owner ${DEMO_OWNER_EMAIL} (password: ${DEMO_OWNER_PASSWORD}).`);
}

async function seed() {
  const db = createDb(connectionString);

  const [existingMerchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.slug, SEED_MERCHANT_SLUG))
    .limit(1);

  if (existingMerchant) {
    await upsertDemoOwner(db, existingMerchant.id);
    console.log("Seed merchant already exists; demo owner credentials refreshed.");
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

  await upsertDemoOwner(db, merchant.id);

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
