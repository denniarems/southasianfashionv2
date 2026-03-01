CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '',
	`created_at` text NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE `hero_banners` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '',
	`image_url` text DEFAULT '',
	`cta_text` text DEFAULT 'Explore Collection',
	`cta_link` text DEFAULT '#new-arrivals',
	`is_active` integer DEFAULT 1,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`otp` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`price` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`category` text,
	`image_url` text DEFAULT '',
	`is_new` integer DEFAULT 1,
	`is_featured` integer DEFAULT 0,
	`collection_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `categories`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`whatsapp_number` text DEFAULT '',
	`whatsapp_message` text DEFAULT '',
	`brand_name` text DEFAULT 'SouthAsianFashion',
	`brand_tagline` text DEFAULT '',
	`contact_email` text DEFAULT '',
	`instagram_url` text DEFAULT '',
	`facebook_url` text DEFAULT ''
);
