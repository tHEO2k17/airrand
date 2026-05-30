import {
  createSessionToken,
  sessionVersionsMatch,
  type SessionTokenPayload,
} from "@airrand/auth";
import { merchantUsers } from "@airrand/database";
import { eq, sql } from "drizzle-orm";
import type { Database } from "@airrand/database";
import { SessionTokenError } from "@airrand/auth";

type DbExecutor = Pick<Database, "update">;

export function assertSessionVersionMatches(
  tokenVersion: number,
  currentVersion: number,
): void {
  if (!sessionVersionsMatch(tokenVersion, currentVersion)) {
    throw new SessionTokenError(
      "SESSION_REVOKED",
      "Session is no longer valid. Please sign in again.",
    );
  }
}

export async function bumpMerchantSessionVersion(
  dbOrTx: DbExecutor,
  merchantUserId: string,
): Promise<number> {
  const [row] = await dbOrTx
    .update(merchantUsers)
    .set({
      sessionVersion: sql`${merchantUsers.sessionVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(merchantUsers.id, merchantUserId))
    .returning({ sessionVersion: merchantUsers.sessionVersion });

  if (!row) {
    throw new Error("Failed to revoke merchant sessions");
  }

  return row.sessionVersion;
}

export function createMerchantSessionToken(input: {
  merchantUserId: string;
  merchantId: string;
  role: SessionTokenPayload["role"];
  email: string;
  sessionVersion: number;
  secret: string;
  ttlMs: number;
}): { token: string; payload: SessionTokenPayload } {
  return createSessionToken({
    merchantUserId: input.merchantUserId,
    merchantId: input.merchantId,
    role: input.role,
    email: input.email,
    sessionVersion: input.sessionVersion,
    secret: input.secret,
    ttlMs: input.ttlMs,
  });
}
