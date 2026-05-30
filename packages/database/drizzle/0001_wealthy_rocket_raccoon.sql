ALTER TABLE "orders" ADD COLUMN "pickup_token_nonce" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pickup_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "picked_up_at" timestamp with time zone;