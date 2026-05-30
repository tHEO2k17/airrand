CREATE TYPE "public"."audit_export_format" AS ENUM('csv');--> statement-breakpoint
CREATE TYPE "public"."audit_export_job_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "audit_export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"requested_by_merchant_user_id" uuid NOT NULL,
	"bull_job_id" text,
	"status" "audit_export_job_status" DEFAULT 'queued' NOT NULL,
	"format" "audit_export_format" DEFAULT 'csv' NOT NULL,
	"file_path" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audit_export_jobs" ADD CONSTRAINT "audit_export_jobs_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_export_jobs" ADD CONSTRAINT "audit_export_jobs_requested_by_merchant_user_id_merchant_users_id_fk" FOREIGN KEY ("requested_by_merchant_user_id") REFERENCES "public"."merchant_users"("id") ON DELETE no action ON UPDATE no action;