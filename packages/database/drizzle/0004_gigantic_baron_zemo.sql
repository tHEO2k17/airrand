ALTER TABLE "merchant_users" ADD COLUMN "invited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "merchant_users" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "merchant_users" ADD COLUMN "created_by_merchant_user_id" uuid;--> statement-breakpoint
ALTER TABLE "merchant_users" ADD CONSTRAINT "merchant_users_created_by_merchant_user_id_fk" FOREIGN KEY ("created_by_merchant_user_id") REFERENCES "public"."merchant_users"("id") ON DELETE set null ON UPDATE no action;