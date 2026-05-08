CREATE TABLE `custom_enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text DEFAULT '',
	`product_id` text,
	`product_slug` text DEFAULT '',
	`product_name` text NOT NULL,
	`product_url` text NOT NULL,
	`requested_start_local` text NOT NULL,
	`requested_timezone` text DEFAULT 'America/Toronto' NOT NULL,
	`preferred_size` text DEFAULT '',
	`measurements` text DEFAULT '',
	`blouse_notes` text DEFAULT '',
	`general_notes` text DEFAULT '',
	`admin_note` text DEFAULT '',
	`approved_at` text,
	`approved_by_email` text,
	`rejected_at` text,
	`rejected_by_email` text,
	`invitation_sent_at` text,
	`invitation_message_id` text,
	`admin_notification_sent_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `custom_enquiries_status_idx` ON `custom_enquiries` (`status`);--> statement-breakpoint
CREATE INDEX `custom_enquiries_created_at_idx` ON `custom_enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `custom_enquiries_product_idx` ON `custom_enquiries` (`product_id`);--> statement-breakpoint
CREATE INDEX `custom_enquiries_email_idx` ON `custom_enquiries` (`customer_email`);
