-- Align legacy database column names with the current Prisma domain fields.
-- RENAME COLUMN preserves existing SKU values.
ALTER TABLE "Sku" RENAME COLUMN "num" TO "stock";
ALTER TABLE "Sku" RENAME COLUMN "skuAttribute" TO "attributes";
