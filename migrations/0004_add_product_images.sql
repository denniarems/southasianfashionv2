-- Migration number: 0004 	 2026-03-15T00:00:00.000Z

CREATE TABLE IF NOT EXISTS "product_images" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
	"image_url" text NOT NULL,
	"sort_order" real NOT NULL DEFAULT 0,
	"created_at" text NOT NULL
);

CREATE INDEX "product_images_product_id_idx" ON "product_images" ("product_id");
