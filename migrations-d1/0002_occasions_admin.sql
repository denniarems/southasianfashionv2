CREATE TABLE `occasions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '',
	`image_url` text DEFAULT '',
	`display_order` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `occasions_slug_unique` ON `occasions` (`slug`);--> statement-breakpoint
INSERT INTO `occasions` (
	`id`,
	`name`,
	`slug`,
	`description`,
	`image_url`,
	`display_order`,
	`created_at`,
	`updated_at`
) VALUES
	('occasion-bridal', 'Bridal', 'bridal', 'Statement lehengas, sarees, and heirloom finishing touches.', '', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
	('occasion-eid', 'Eid', 'eid', 'Refined festive pieces with rich texture and graceful drape.', '', 2, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
	('occasion-diwali', 'Diwali', 'diwali', 'Celebration-ready silhouettes with luminous detail.', '', 3, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
	('occasion-wedding-guest', 'Wedding Guest', 'wedding-guest', 'Elegant outfits for ceremonies, receptions, and sangeet nights.', '', 4, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
	('occasion-groom', 'Groom', 'groom', 'Sherwani, kurta, and formalwear directions for the groom.', '', 5, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
	('occasion-temple-jewelry', 'Temple Jewelry', 'temple-jewelry', 'Ornate jewelry accents for classical and ceremonial styling.', '', 6, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
