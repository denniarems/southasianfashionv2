ALTER TABLE `products` ADD `occasion` text;--> statement-breakpoint
ALTER TABLE `products` ADD `fabric` text;--> statement-breakpoint
ALTER TABLE `products` ADD `color` text;--> statement-breakpoint
ALTER TABLE `products` ADD `availability_status` text DEFAULT 'made-to-order';--> statement-breakpoint
ALTER TABLE `products` ADD `is_ready_to_ship` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `products` ADD `display_order` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `updated_at` text;--> statement-breakpoint
UPDATE `products` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `display_order` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `seo_title` text DEFAULT '';--> statement-breakpoint
ALTER TABLE `collections` ADD `seo_description` text DEFAULT '';--> statement-breakpoint
ALTER TABLE `collections` ADD `updated_at` text;--> statement-breakpoint
UPDATE `collections` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_name` text NOT NULL,
	`route` text DEFAULT '',
	`product_id` text,
	`product_slug` text,
	`collection_id` text,
	`collection_slug` text,
	`category` text,
	`filter_keys` text DEFAULT '',
	`device_class` text DEFAULT 'unknown',
	`timestamp_bucket` text NOT NULL,
	`value` real DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_name_idx` ON `analytics_events` (`event_name`);--> statement-breakpoint
CREATE INDEX `analytics_events_product_idx` ON `analytics_events` (`product_id`);
