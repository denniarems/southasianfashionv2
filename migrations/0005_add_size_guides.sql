-- Migration number: 0005 	 2026-03-02T00:00:00.000Z

CREATE TABLE IF NOT EXISTS "size_guides" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"product_type" text DEFAULT '',
	"unit" text NOT NULL DEFAULT 'in',
	"note" text DEFAULT '',
	"columns_json" text NOT NULL DEFAULT '[]',
	"rows_json" text NOT NULL DEFAULT '[]',
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" text NOT NULL
);

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "size_guide_id" text REFERENCES "size_guides"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "products_size_guide_id_idx" ON "products" ("size_guide_id");
CREATE INDEX IF NOT EXISTS "size_guides_is_active_idx" ON "size_guides" ("is_active");
