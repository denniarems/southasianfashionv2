-- Migration number: 0002 	 2026-03-02T00:00:00.000Z

ALTER TABLE "products" ADD COLUMN "slug" text;

WITH normalized AS (
	SELECT
		id,
		COALESCE(
			NULLIF(
				REGEXP_REPLACE(
					LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')),
					'(^-|-$)',
					'',
					'g'
				),
				''
			),
			'product'
		) AS base_slug
	FROM products
),
ranked AS (
	SELECT
		id,
		CASE
			WHEN ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) = 1 THEN base_slug
			ELSE base_slug || '-' || ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id)
		END AS final_slug
	FROM normalized
)
UPDATE products p
SET slug = r.final_slug
FROM ranked r
WHERE p.id = r.id;

ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "products_slug_unique" ON "products" ("slug");
