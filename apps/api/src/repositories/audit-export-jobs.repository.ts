import {
  auditExportJobs,
  type AuditExportJob,
  type Database,
} from "@airrand/database";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db.js";

export type AuditExportJobsRepository = {
  findByMerchantAndId: (
    merchantId: string,
    exportJobId: string,
  ) => Promise<AuditExportJob | null>;
};

export function createAuditExportJobsRepository(
  database: Database = db,
): AuditExportJobsRepository {
  return {
    async findByMerchantAndId(merchantId: string, exportJobId: string) {
      const [job] = await database
        .select()
        .from(auditExportJobs)
        .where(
          and(
            eq(auditExportJobs.id, exportJobId),
            eq(auditExportJobs.merchantId, merchantId),
          ),
        )
        .limit(1);
      return job ?? null;
    },
  };
}

export const auditExportJobsRepository = createAuditExportJobsRepository();
