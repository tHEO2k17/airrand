CREATE SEQUENCE IF NOT EXISTS "order_reference_seq" START WITH 1001 INCREMENT BY 1 MINVALUE 1;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reference" text;--> statement-breakpoint
DO $$
DECLARE
  order_row RECORD;
BEGIN
  FOR order_row IN
    SELECT id FROM "orders" ORDER BY "created_at" ASC, id ASC
  LOOP
    UPDATE "orders"
    SET "reference" = 'ORD-' || nextval('order_reference_seq')
    WHERE id = order_row.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "reference" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_reference_unique" UNIQUE("reference");
