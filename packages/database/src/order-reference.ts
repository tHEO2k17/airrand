import { formatOrderReference } from "@airrand/domain";
import { sql } from "drizzle-orm";
import type { Database } from "./client.js";

type DbExecutor = Pick<Database, "execute">;

/** Allocates the next ORD-{n} reference from the database sequence. */
export async function generateOrderReference(dbOrTx: DbExecutor): Promise<string> {
  return allocateOrderReference(dbOrTx);
}

export async function allocateOrderReference(dbOrTx: DbExecutor): Promise<string> {
  const result = await dbOrTx.execute<{ value: string }>(
    sql`SELECT nextval('order_reference_seq')::text AS value`,
  );

  const row = result[0];
  const sequenceNumber = Number(row?.value);
  if (!Number.isFinite(sequenceNumber)) {
    throw new Error("Failed to allocate order reference sequence");
  }

  return formatOrderReference(sequenceNumber);
}
