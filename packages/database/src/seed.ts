import { hashPassword } from "@airrand/auth";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import path from "node:path";
import { createDb } from "./client.js";
import { merchantUsers, merchants, productCategories, products } from "./schema/index.js";
import type { MerchantUserRole } from "./schema/merchant-user-role.js";

config({ path: path.resolve(process.cwd(), "../../.env") });
config();

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/airrand";

const SEED_MERCHANT_SLUG = "demo-cafe";

/** Local demo only — change before any real deployment. */
const DEMO_PASSWORD = "ChangeMe123!";

const DEMO_USERS: Array<{
  email: string;
  displayName: string;
  role: MerchantUserRole;
}> = [
  { email: "owner@demo-cafe.test", displayName: "Demo Owner", role: "owner" },
  {
    email: "manager@demo-cafe.test",
    displayName: "Demo Manager",
    role: "manager",
  },
  { email: "staff@demo-cafe.test", displayName: "Demo Staff", role: "staff" },
];

const DEMO_CATEGORIES: Array<{
  name: string;
  iconKey: string;
  sortOrder: number;
}> = [
  { name: "Drinks", iconKey: "cup", sortOrder: 0 },
  { name: "Snacks", iconKey: "cookie", sortOrder: 1 },
  { name: "Toiletries", iconKey: "sparkles", sortOrder: 2 },
  { name: "OTC / Wellness", iconKey: "heart-pulse", sortOrder: 3 },
  { name: "Laundry Services", iconKey: "shirt", sortOrder: 4 },
];

const DEMO_PRODUCTS: Array<{
  name: string;
  description: string;
  unitPriceCents: number;
  categoryName: string;
  stockState: "in_stock" | "low_stock" | "out_of_stock";
  stockQuantity?: number;
}> = [
  {
    name: "Espresso",
    description: "Single shot",
    unitPriceCents: 350,
    categoryName: "Drinks",
    stockState: "in_stock",
    stockQuantity: 50,
  },
  {
    name: "Cold Brew",
    description: "12oz iced",
    unitPriceCents: 500,
    categoryName: "Drinks",
    stockState: "low_stock",
    stockQuantity: 4,
  },
  {
    name: "Croissant",
    description: "Butter croissant",
    unitPriceCents: 450,
    categoryName: "Snacks",
    stockState: "in_stock",
  },
  {
    name: "Hand Sanitizer",
    description: "Travel size",
    unitPriceCents: 250,
    categoryName: "Toiletries",
    stockState: "in_stock",
  },
  {
    name: "Pain Relief Tablets",
    description: "OTC pack",
    unitPriceCents: 800,
    categoryName: "OTC / Wellness",
    stockState: "in_stock",
  },
];

async function upsertDemoUser(
  db: ReturnType<typeof createDb>,
  merchantId: string,
  user: (typeof DEMO_USERS)[number],
) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const [existingUser] = await db
    .select({ id: merchantUsers.id })
    .from(merchantUsers)
    .where(eq(merchantUsers.email, user.email))
    .limit(1);

  if (existingUser) {
    await db
      .update(merchantUsers)
      .set({
        merchantId,
        passwordHash,
        role: user.role,
        displayName: user.displayName,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(merchantUsers.id, existingUser.id));
    console.log(
      `Updated demo ${user.role} ${user.email} (password: ${DEMO_PASSWORD}).`,
    );
    return;
  }

  await db.insert(merchantUsers).values({
    merchantId,
    email: user.email,
    displayName: user.displayName,
    passwordHash,
    role: user.role,
    isActive: true,
  });

  console.log(
    `Created demo ${user.role} ${user.email} (password: ${DEMO_PASSWORD}).`,
  );
}

async function seedDemoUsers(
  db: ReturnType<typeof createDb>,
  merchantId: string,
) {
  for (const user of DEMO_USERS) {
    await upsertDemoUser(db, merchantId, user);
  }
}

async function ensureDemoCategories(
  db: ReturnType<typeof createDb>,
  merchantId: string,
): Promise<Map<string, string>> {
  const categoryIdByName = new Map<string, string>();

  for (const def of DEMO_CATEGORIES) {
    const [existing] = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.merchantId, merchantId),
          eq(productCategories.name, def.name),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(productCategories)
        .set({
          iconKey: def.iconKey,
          sortOrder: def.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(productCategories.id, existing.id));
      categoryIdByName.set(def.name, existing.id);
      continue;
    }

    const [created] = await db
      .insert(productCategories)
      .values({
        merchantId,
        name: def.name,
        iconKey: def.iconKey,
        sortOrder: def.sortOrder,
        isActive: true,
      })
      .returning();

    if (created) {
      categoryIdByName.set(def.name, created.id);
    }
  }

  return categoryIdByName;
}

async function ensureDemoProducts(
  db: ReturnType<typeof createDb>,
  merchantId: string,
  categoryIdByName: Map<string, string>,
) {
  for (const def of DEMO_PRODUCTS) {
    const categoryId = categoryIdByName.get(def.categoryName) ?? null;
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(eq(products.merchantId, merchantId), eq(products.name, def.name)),
      )
      .limit(1);

    if (existing) {
      await db
        .update(products)
        .set({
          categoryId,
          description: def.description,
          unitPriceCents: def.unitPriceCents,
          isAvailable: def.stockState !== "out_of_stock",
          stockState: def.stockState,
          stockQuantity: def.stockQuantity ?? null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existing.id));
      continue;
    }

    await db.insert(products).values({
      merchantId,
      categoryId,
      name: def.name,
      description: def.description,
      unitPriceCents: def.unitPriceCents,
      isAvailable: def.stockState !== "out_of_stock",
      stockState: def.stockState,
      stockQuantity: def.stockQuantity ?? null,
    });
  }
}

async function seedDemoCatalog(
  db: ReturnType<typeof createDb>,
  merchantId: string,
) {
  const categoryIdByName = await ensureDemoCategories(db, merchantId);
  await ensureDemoProducts(db, merchantId, categoryIdByName);
  console.log("Demo categories and products ensured.");
}

async function seed() {
  const db = createDb(connectionString);

  const [existingMerchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.slug, SEED_MERCHANT_SLUG))
    .limit(1);

  if (existingMerchant) {
    await db
      .update(merchants)
      .set({
        description: "Terminal kiosk with drinks, snacks, and travel essentials.",
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, existingMerchant.id));
    await seedDemoUsers(db, existingMerchant.id);
    await seedDemoCatalog(db, existingMerchant.id);
    console.log("Seed merchant already exists; demo staff and catalog refreshed.");
    return;
  }

  const [merchant] = await db
    .insert(merchants)
    .values({
      name: "Demo Cafe",
      slug: SEED_MERCHANT_SLUG,
      description: "Terminal kiosk with drinks, snacks, and travel essentials.",
    })
    .returning();

  if (!merchant) {
    throw new Error("Failed to create seed merchant");
  }

  await seedDemoUsers(db, merchant.id);
  await seedDemoCatalog(db, merchant.id);

  console.log(`Seeded merchant ${merchant.id} (${SEED_MERCHANT_SLUG}) with catalog.`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
