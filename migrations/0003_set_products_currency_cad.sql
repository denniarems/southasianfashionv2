-- Migration number: 0003 	 2026-03-02T00:10:00.000Z

-- Convert existing USD product rows to CAD for this store
UPDATE "products"
SET "currency" = 'CAD'
WHERE "currency" = 'USD';

-- Ensure future rows default to CAD
ALTER TABLE "products"
ALTER COLUMN "currency" SET DEFAULT 'CAD';
