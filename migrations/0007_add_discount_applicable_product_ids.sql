ALTER TABLE "discounts"
ADD COLUMN IF NOT EXISTS "applicable_product_ids" text[] NOT NULL DEFAULT '{}'::text[];

UPDATE "discounts"
SET "applicable_product_ids" = ARRAY["product_id"]::text[]
WHERE "product_id" IS NOT NULL
	AND COALESCE(array_length("applicable_product_ids", 1), 0) = 0;