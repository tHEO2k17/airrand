import { hashPassword } from "@airrand/auth";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import path from "node:path";
import { createDb } from "./client.js";
import { merchantUsers, merchants, products } from "./schema/index.js";
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

async function seed() {
  const db = createDb(connectionString);

  const [existingMerchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.slug, SEED_MERCHANT_SLUG))
    .limit(1);

  if (existingMerchant) {
    await seedDemoUsers(db, existingMerchant.id);
    console.log("Seed merchant already exists; demo staff credentials refreshed.");
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

  await seedDemoUsers(db, merchant.id);

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
