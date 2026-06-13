/*
  Warnings:

  - You are about to drop the column `comment_content` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `comment_left` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `comment_parent_id` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `comment_product` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `comment_right` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `comment_user` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `inventory_reservations` on the `inventories` table. All the data in the column will be lost.
  - You are about to drop the column `account_id` on the `key_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `key_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `order_checkout` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_payment` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_product` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_status` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_tracking_number` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_userId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token_use` on the `refresh_tokens_used` table. All the data in the column will be lost.
  - You are about to drop the `api_keys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clothes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `electronics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `furnitures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sd_product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shops` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sku` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[auth_id,device_id]` on the table `key_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `author_id` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spu_id` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_id` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_type` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopBusinessId` to the `inventories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `auth_id` to the `key_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `device_id` to the `key_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expired_at` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_info` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping_fee` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping_street` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopBusinessId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_discount ` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key_token_id` to the `refresh_tokens_used` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('USER', 'SHOP', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('EMAIL_PASSWORD', 'OAUTH2_ONLY', 'HYBRID');

-- CreateEnum
CREATE TYPE "AdminLevel" AS ENUM ('JUNIOR', 'SENIOR', 'MANAGER', 'DIRECTOR', 'SUPER');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('TEXT', 'HTML', 'MARKDOWN');

-- CreateEnum
CREATE TYPE "CommentTargetType" AS ENUM ('PRODUCT', 'ORDER', 'REVIEW', 'SHOP', 'BLOG_POST', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('USER', 'SHOP', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PENDING', 'REJECTED', 'HIDDEN', 'SPAM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRODUCT', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('USER_TO_SHOP', 'SHOP_TO_USER');

-- CreateEnum
CREATE TYPE "UserSocialProvider" AS ENUM ('GOOGLE', 'FACEBOOK');

-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "clothes" DROP CONSTRAINT "clothes_product_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_comment_product_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_comment_user_fkey";

-- DropForeignKey
ALTER TABLE "discounts" DROP CONSTRAINT "discounts_discount_shop_fkey";

-- DropForeignKey
ALTER TABLE "electronics" DROP CONSTRAINT "electronics_product_id_fkey";

-- DropForeignKey
ALTER TABLE "furnitures" DROP CONSTRAINT "furnitures_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_inventory_product_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_order_userId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_product_shop_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens_used" DROP CONSTRAINT "refresh_tokens_used_refresh_token_use_fkey";

-- DropIndex
DROP INDEX "cart_products_id_key";

-- DropIndex
DROP INDEX "carts_id_key";

-- DropIndex
DROP INDEX "comments_comment_parent_id_key";

-- DropIndex
DROP INDEX "comments_comment_product_key";

-- DropIndex
DROP INDEX "comments_comment_user_key";

-- DropIndex
DROP INDEX "comments_id_key";

-- DropIndex
DROP INDEX "discounts_id_key";

-- DropIndex
DROP INDEX "inventories_id_key";

-- DropIndex
DROP INDEX "key_tokens_account_id_key";

-- DropIndex
DROP INDEX "key_tokens_id_key";

-- DropIndex
DROP INDEX "orders_id_key";

-- DropIndex
DROP INDEX "orders_order_userId_key";

-- DropIndex
DROP INDEX "refresh_tokens_used_id_key";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "comment_content",
DROP COLUMN "comment_left",
DROP COLUMN "comment_parent_id",
DROP COLUMN "comment_product",
DROP COLUMN "comment_right",
DROP COLUMN "comment_user",
ADD COLUMN     "author_id" TEXT NOT NULL,
ADD COLUMN     "author_type" "CommentAuthorType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "content_type" "CommentType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "dislikes_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "edited_at" BIGINT,
ADD COLUMN     "ip_address" TEXT DEFAULT '127.0.0.1',
ADD COLUMN     "is_edited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likes_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "replies_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "spu_id" TEXT NOT NULL,
ADD COLUMN     "status" "CommentStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "target_id" TEXT NOT NULL,
ADD COLUMN     "target_type" "CommentTargetType" NOT NULL,
ADD COLUMN     "thread_id" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "inventories" DROP COLUMN "inventory_reservations",
ADD COLUMN     "shopBusinessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "key_tokens" DROP COLUMN "account_id",
DROP COLUMN "roles",
ADD COLUMN     "auth_id" TEXT NOT NULL,
ADD COLUMN     "device_id" TEXT NOT NULL,
ADD COLUMN     "expires_at" BIGINT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "order_checkout",
DROP COLUMN "order_payment",
DROP COLUMN "order_product",
DROP COLUMN "order_status",
DROP COLUMN "order_tracking_number",
DROP COLUMN "order_userId",
ADD COLUMN     "expired_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "payment_info" JSONB NOT NULL,
ADD COLUMN     "payment_intent_id" TEXT,
ADD COLUMN     "shipping_fee" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "shipping_street" TEXT NOT NULL,
ADD COLUMN     "shopBusinessId" TEXT NOT NULL,
ADD COLUMN     "status" "OrderStatus" NOT NULL,
ADD COLUMN     "total_discount " DECIMAL(65,30) NOT NULL,
ADD COLUMN     "total_price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens_used" DROP COLUMN "refresh_token_use",
ADD COLUMN     "device_info" TEXT,
ADD COLUMN     "key_token_id" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT;

-- DropTable
DROP TABLE "api_keys";

-- DropTable
DROP TABLE "clothes";

-- DropTable
DROP TABLE "electronics";

-- DropTable
DROP TABLE "furnitures";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "sd_product";

-- DropTable
DROP TABLE "shops";

-- DropTable
DROP TABLE "sku";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "AccountLoginRequestStatus";

-- DropEnum
DROP TYPE "ProductType";

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_authentication" (
    "accountId" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "password_salt" TEXT,
    "auth_method" "AuthMethod" NOT NULL DEFAULT 'EMAIL_PASSWORD',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" BIGINT,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "account_authentication_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "social_authentication" (
    "id" TEXT NOT NULL,
    "auth_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_email" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "social_authentication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_security" (
    "accountId" TEXT NOT NULL,
    "roles" TEXT[],
    "permissions" TEXT[],
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "backup_codes" TEXT[],
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" BIGINT,
    "suspicious_activity" BOOLEAN NOT NULL DEFAULT false,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "account_security_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_behavior" (
    "accountId" TEXT NOT NULL,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "membership_tier" TEXT DEFAULT 'bronze',
    "sex" "Sex" NOT NULL DEFAULT 'FEMALE',
    "preferences" JSONB,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "user_behavior_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "shop_business" (
    "accountId" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "tax_id" TEXT,
    "business_address" TEXT,
    "total_sales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "shop_business_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "admin_access" (
    "accountId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "admin_level" "AdminLevel" NOT NULL,
    "supervisor" TEXT,
    "modules" TEXT[],
    "territories" TEXT[],
    "last_activity" BIGINT,
    "actions_today" INTEGER NOT NULL DEFAULT 0,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "admin_access_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "account_profiles" (
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "timezone" TEXT,
    "language" TEXT DEFAULT 'en',
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "account_profiles_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "account_preferences" (
    "accountId" TEXT NOT NULL,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "profile_visibility" TEXT NOT NULL DEFAULT 'public',
    "data_sharing" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "account_preferences_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "auth_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "used_ip_address" TEXT,
    "used_user_agent" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_inventories" (
    "id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "reservation_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_closure" (
    "ancestorId" TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "comment_closure_pkey" PRIMARY KEY ("ancestorId","descendantId")
);

-- CreateTable
CREATE TABLE "notification_threads" (
    "id" TEXT NOT NULL,
    "noti_thread_user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "notification_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "noti_type" "NotificationType" NOT NULL,
    "noti_sender_id" TEXT NOT NULL,
    "noti_thread_id" TEXT NOT NULL,
    "noti_content" TEXT NOT NULL,
    "noti_option" JSONB NOT NULL,
    "notification_status" TEXT NOT NULL DEFAULT 'unread',
    "noti_product_id" TEXT,
    "noti_discount_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spu" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "intro" VARCHAR(200),
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "images" VARCHAR(1000)[],
    "afterSalesService" VARCHAR(50),
    "content" TEXT,
    "attributeList" VARCHAR(3000),
    "isMarketable" BOOLEAN NOT NULL DEFAULT false,
    "status" INTEGER NOT NULL DEFAULT 0,
    "shopBusinessId" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Spu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 1,
    "num" INTEGER DEFAULT 100,
    "image" VARCHAR(200),
    "images" VARCHAR(2000)[],
    "spuId" VARCHAR(60) NOT NULL,
    "brandName" VARCHAR(100),
    "skuAttribute" VARCHAR(200),
    "status" INTEGER DEFAULT 1,
    "inventory_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "sort" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryClosureTable" (
    "ancestorId" TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "CategoryClosureTable_pkey" PRIMARY KEY ("ancestorId","descendantId")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "image" VARCHAR(1000) NOT NULL DEFAULT '',
    "initial" VARCHAR(1) NOT NULL DEFAULT '',
    "sort" INTEGER DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryBrand" (
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "CategoryBrand_pkey" PRIMARY KEY ("brandId","categoryId")
);

-- CreateTable
CREATE TABLE "CategoryAttr" (
    "categoryId" TEXT NOT NULL,
    "attrId" TEXT NOT NULL,

    CONSTRAINT "CategoryAttr_pkey" PRIMARY KEY ("categoryId","attrId")
);

-- CreateTable
CREATE TABLE "SkuAttribute" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "options" VARCHAR(2000),
    "sort" INTEGER,

    CONSTRAINT "SkuAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_authentication_username_key" ON "account_authentication"("username");

-- CreateIndex
CREATE UNIQUE INDEX "account_authentication_email_key" ON "account_authentication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "social_authentication_auth_id_provider_key" ON "social_authentication"("auth_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "social_authentication_provider_provider_id_key" ON "social_authentication"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_deviceId_key" ON "DeviceSession"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "account_profiles_phone_key" ON "account_profiles"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_auth_id_idx" ON "password_resets"("auth_id");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_inventories_inventory_id_user_id_key" ON "reservation_inventories"("inventory_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_threads_noti_thread_user_id_key" ON "notification_threads"("noti_thread_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Spu_name_key" ON "Spu"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Spu_name_brandId_key" ON "Spu"("name", "brandId");

-- CreateIndex
CREATE INDEX "Sku_status_idx" ON "Sku"("status");

-- CreateIndex
CREATE INDEX "updated" ON "Sku"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "key_tokens_auth_id_device_id_key" ON "key_tokens"("auth_id", "device_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_used_key_token_id_idx" ON "refresh_tokens_used"("key_token_id");

-- AddForeignKey
ALTER TABLE "account_authentication" ADD CONSTRAINT "account_authentication_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_authentication" ADD CONSTRAINT "social_authentication_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "account_authentication"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_security" ADD CONSTRAINT "account_security_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_business" ADD CONSTRAINT "shop_business_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_access" ADD CONSTRAINT "admin_access_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_profiles" ADD CONSTRAINT "account_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_preferences" ADD CONSTRAINT "account_preferences_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_tokens" ADD CONSTRAINT "key_tokens_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "account_authentication"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens_used" ADD CONSTRAINT "refresh_tokens_used_key_token_id_fkey" FOREIGN KEY ("key_token_id") REFERENCES "key_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "account_authentication"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_access"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_inventory_product_id_fkey" FOREIGN KEY ("inventory_product_id") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_shopBusinessId_fkey" FOREIGN KEY ("shopBusinessId") REFERENCES "shop_business"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_inventories" ADD CONSTRAINT "reservation_inventories_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_discount_shop_fkey" FOREIGN KEY ("discount_shop") REFERENCES "shop_business"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_cart_userId_fkey" FOREIGN KEY ("cart_userId") REFERENCES "user_behavior"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_behavior"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shopBusinessId_fkey" FOREIGN KEY ("shopBusinessId") REFERENCES "shop_business"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_closure" ADD CONSTRAINT "comment_closure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_closure" ADD CONSTRAINT "comment_closure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "Spu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_threads" ADD CONSTRAINT "notification_threads_noti_thread_user_id_fkey" FOREIGN KEY ("noti_thread_user_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_noti_sender_id_fkey" FOREIGN KEY ("noti_sender_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_noti_thread_id_fkey" FOREIGN KEY ("noti_thread_id") REFERENCES "notification_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spu" ADD CONSTRAINT "Spu_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spu" ADD CONSTRAINT "Spu_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spu" ADD CONSTRAINT "Spu_shopBusinessId_fkey" FOREIGN KEY ("shopBusinessId") REFERENCES "shop_business"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_spuId_fkey" FOREIGN KEY ("spuId") REFERENCES "Spu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryClosureTable" ADD CONSTRAINT "CategoryClosureTable_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryClosureTable" ADD CONSTRAINT "CategoryClosureTable_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBrand" ADD CONSTRAINT "CategoryBrand_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBrand" ADD CONSTRAINT "CategoryBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttr" ADD CONSTRAINT "CategoryAttr_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttr" ADD CONSTRAINT "CategoryAttr_attrId_fkey" FOREIGN KEY ("attrId") REFERENCES "SkuAttribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
