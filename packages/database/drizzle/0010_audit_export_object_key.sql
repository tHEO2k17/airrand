ALTER TABLE "audit_export_jobs" ADD COLUMN "object_key" text;--> statement-breakpoint
UPDATE "audit_export_jobs" SET "object_key" = 'audit-exports/' || "file_path" WHERE "file_path" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_export_jobs" DROP COLUMN "file_path";
