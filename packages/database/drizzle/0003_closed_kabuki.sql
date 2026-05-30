CREATE TYPE "public"."merchant_user_role" AS ENUM('owner', 'manager', 'staff');--> statement-breakpoint
ALTER TABLE "merchant_users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "merchant_users" ADD COLUMN "role" "merchant_user_role" DEFAULT 'staff' NOT NULL;--> statement-breakpoint
ALTER TABLE "merchant_users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "merchant_users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_users_email_unique" ON "merchant_users" USING btree ("email");