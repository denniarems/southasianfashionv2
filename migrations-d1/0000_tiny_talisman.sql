CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '',
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`image_url` text DEFAULT '',
	`slug` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE TABLE `discount_usages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discount_id` text NOT NULL,
	`user_key` text NOT NULL,
	`use_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` text NOT NULL,
	FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discount_usages_discount_user_key_unique` ON `discount_usages` (`discount_id`,`user_key`);--> statement-breakpoint
CREATE INDEX `discount_usages_discount_idx` ON `discount_usages` (`discount_id`);--> statement-breakpoint
CREATE INDEX `discount_usages_user_idx` ON `discount_usages` (`user_key`);--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`discount_type` text NOT NULL,
	`discount_value` real DEFAULT 0 NOT NULL,
	`original_price` real,
	`start_date` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`end_date` integer,
	`min_cart_value` real DEFAULT 0 NOT NULL,
	`applicable_product_ids` text DEFAULT '[]' NOT NULL,
	`applicable_categories` text DEFAULT '[]' NOT NULL,
	`stackable` integer DEFAULT false NOT NULL,
	`max_uses` integer,
	`priority` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`product_id` text,
	`bundle_product_ids` text DEFAULT '[]' NOT NULL,
	`tier_rules_json` text DEFAULT '[]' NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`wording` text DEFAULT 'Instant Price Drop' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `discounts_product_id_idx` ON `discounts` (`product_id`);--> statement-breakpoint
CREATE INDEX `discounts_active_idx` ON `discounts` (`is_active`);--> statement-breakpoint
CREATE INDEX `discounts_priority_idx` ON `discounts` (`priority`);--> statement-breakpoint
CREATE INDEX `discounts_type_idx` ON `discounts` (`discount_type`);--> statement-breakpoint
CREATE TABLE `hero_banners` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '',
	`image_url` text DEFAULT '',
	`cta_text` text DEFAULT 'Explore Collection',
	`cta_link` text DEFAULT '#new-arrivals',
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`age_range` text DEFAULT '',
	`gender` text DEFAULT '',
	`ethnicity` text DEFAULT '',
	`image_url` text NOT NULL,
	`prompt_used` text DEFAULT '',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`otp` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`image_url` text NOT NULL,
	`sort_order` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '',
	`price` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`category` text,
	`image_url` text DEFAULT '',
	`is_new` integer DEFAULT true,
	`is_featured` integer DEFAULT false,
	`collection_id` text,
	`size_guide_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`size_guide_id`) REFERENCES `size_guides`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`whatsapp_number` text DEFAULT '',
	`whatsapp_message` text DEFAULT '',
	`brand_name` text DEFAULT 'SouthAsianFashion',
	`brand_tagline` text DEFAULT '',
	`contact_email` text DEFAULT '',
	`instagram_url` text DEFAULT '',
	`facebook_url` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `size_guides` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`product_type` text DEFAULT '',
	`unit` text DEFAULT 'in' NOT NULL,
	`note` text DEFAULT '',
	`columns_json` text DEFAULT '[]' NOT NULL,
	`rows_json` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
