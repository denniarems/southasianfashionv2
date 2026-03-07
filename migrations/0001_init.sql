-- Migration number: 0001 	 2026-03-07T00:00:00.000Z

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL UNIQUE,
	slug text NOT NULL UNIQUE,
	description text DEFAULT '',
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	description text DEFAULT '',
	image_url text DEFAULT '',
	slug text NOT NULL UNIQUE,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS size_guides (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	product_type text DEFAULT '',
	unit text NOT NULL DEFAULT 'in',
	note text DEFAULT '',
	columns_json text NOT NULL DEFAULT '[]',
	rows_json text NOT NULL DEFAULT '[]',
	is_active integer NOT NULL DEFAULT 1,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	slug text NOT NULL UNIQUE,
	description text DEFAULT '',
	price real NOT NULL DEFAULT 0,
	currency text NOT NULL DEFAULT 'CAD',
	category text,
	image_url text DEFAULT '',
	is_new integer DEFAULT 1,
	is_featured integer DEFAULT 0,
	collection_id text REFERENCES collections(id),
	size_guide_id text REFERENCES size_guides(id) ON DELETE SET NULL,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS product_images (
	id text PRIMARY KEY NOT NULL,
	product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	image_url text NOT NULL,
	sort_order integer NOT NULL DEFAULT 0,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS hero_banners (
	id text PRIMARY KEY NOT NULL,
	title text NOT NULL,
	subtitle text DEFAULT '',
	image_url text DEFAULT '',
	cta_text text DEFAULT 'Explore Collection',
	cta_link text DEFAULT '#new-arrivals',
	is_active integer DEFAULT 1,
	created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	whatsapp_number text DEFAULT '',
	whatsapp_message text DEFAULT '',
	brand_name text DEFAULT 'SouthAsianFashion',
	brand_tagline text DEFAULT '',
	contact_email text DEFAULT '',
	instagram_url text DEFAULT '',
	facebook_url text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS otp_codes (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	email text NOT NULL,
	otp text NOT NULL,
	created_at text NOT NULL,
	expires_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS discounts (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	description text DEFAULT '',
	discount_type text NOT NULL CHECK (discount_type IN ('flat', 'percentage', 'tiered', 'bundle')),
	discount_value real NOT NULL DEFAULT 0,
	original_price real,
	start_date text NOT NULL,
	end_date text,
	min_cart_value real NOT NULL DEFAULT 0,
	applicable_product_ids text NOT NULL DEFAULT '[]',
	applicable_categories text NOT NULL DEFAULT '[]',
	stackable integer NOT NULL DEFAULT 0,
	max_uses integer,
	priority integer NOT NULL DEFAULT 0,
	is_active integer NOT NULL DEFAULT 1,
	product_id text REFERENCES products(id) ON DELETE CASCADE,
	bundle_product_ids text NOT NULL DEFAULT '[]',
	tier_rules_json text NOT NULL DEFAULT '[]',
	usage_count integer NOT NULL DEFAULT 0,
	wording text NOT NULL DEFAULT 'Instant Price Drop',
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS discounts_product_id_idx ON discounts(product_id);
CREATE INDEX IF NOT EXISTS discounts_active_idx ON discounts(is_active);
CREATE INDEX IF NOT EXISTS discounts_priority_idx ON discounts(priority);
CREATE INDEX IF NOT EXISTS discounts_type_idx ON discounts(discount_type);

CREATE TABLE IF NOT EXISTS discount_usages (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	discount_id text NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
	user_key text NOT NULL,
	use_count integer NOT NULL DEFAULT 0,
	last_used_at text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS discount_usages_discount_user_key_unique
	ON discount_usages(discount_id, user_key);
CREATE INDEX IF NOT EXISTS discount_usages_discount_idx ON discount_usages(discount_id);
CREATE INDEX IF NOT EXISTS discount_usages_user_idx ON discount_usages(user_key);
