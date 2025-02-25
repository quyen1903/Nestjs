/*
  Warnings:

  - The `created_at` column on the `api_keys` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `api_keys` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `cart_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `cart_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `carts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `carts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `clothes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `clothes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `comments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `comments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `discounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `discounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `electronics` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `electronics` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `furnitures` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `furnitures` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `inventories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `inventories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `key_tokens` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `key_tokens` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `shops` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `shops` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `SdProduct` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `refresh_tokens_used` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "cart_products" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "clothes" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "discounts" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "electronics" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "furnitures" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "inventories" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "key_tokens" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "refresh_tokens_used" ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "SdProduct";

-- CreateTable
CREATE TABLE "sd_product" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    "sd_product_name" TEXT NOT NULL DEFAULT '',
    "sd_product_desc" TEXT NOT NULL DEFAULT '',
    "sd_product_status" INTEGER NOT NULL,
    "sd_product_attributes" JSONB NOT NULL,
    "sd_product_shop_id" TEXT NOT NULL,
    "isDeleted" INTEGER NOT NULL,

    CONSTRAINT "sd_product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sd_product_id_key" ON "sd_product"("id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_used_id_key" ON "refresh_tokens_used"("id");
