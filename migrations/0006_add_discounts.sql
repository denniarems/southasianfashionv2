-- Migration number: 0006 	 2026-03-02T00:00:00.000Z

DO $$ BEGIN
	CREATE TYPE "discount_type" AS ENUM ('flat', 'percentage', 'tiered', 'bundle');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "discounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"discount_type" "discount_type" NOT NULL,
	"discount_value" real NOT NULL DEFAULT 0,
	"original_price" real,
	"start_date" timestamp with time zone NOT NULL DEFAULT now(),
	"end_date" timestamp with time zone,
	"min_cart_value" real NOT NULL DEFAULT 0,
	"applicable_categories" text[] NOT NULL DEFAULT '{}'::text[],
	"stackable" boolean NOT NULL DEFAULT false,
	"max_uses" integer,
	"priority" integer NOT NULL DEFAULT 0,
	"is_active" boolean NOT NULL DEFAULT true,
	"product_id" text REFERENCES "products"("id") ON DELETE CASCADE,
	"bundle_product_ids" text[] NOT NULL DEFAULT '{}'::text[],
	"tier_rules_json" text NOT NULL DEFAULT '[]',
	"usage_count" integer NOT NULL DEFAULT 0,
	"wording" text NOT NULL DEFAULT 'Instant Price Drop',
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "discount_usages" (
	"id" serial PRIMARY KEY NOT NULL,
	"discount_id" text NOT NULL REFERENCES "discounts"("id") ON DELETE CASCADE,
	"user_key" text NOT NULL,
	"use_count" integer NOT NULL DEFAULT 0,
	"last_used_at" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "discount_usages_discount_user_key_unique"
	ON "discount_usages" ("discount_id", "user_key");

CREATE INDEX IF NOT EXISTS "discounts_product_id_idx" ON "discounts" ("product_id");
CREATE INDEX IF NOT EXISTS "discounts_active_idx" ON "discounts" ("is_active");
CREATE INDEX IF NOT EXISTS "discounts_priority_idx" ON "discounts" ("priority");
CREATE INDEX IF NOT EXISTS "discounts_type_idx" ON "discounts" ("discount_type");
CREATE INDEX IF NOT EXISTS "discount_usages_discount_idx" ON "discount_usages" ("discount_id");
CREATE INDEX IF NOT EXISTS "discount_usages_user_idx" ON "discount_usages" ("user_key");
