-- CreateEnum
CREATE TYPE "AccountLoginRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('SHOP', 'USER');

-- CreateEnum
CREATE TYPE "CartState" AS ENUM ('ACTIVE', 'COMPLETE', 'FAIL', 'PENDING');

-- CreateEnum
CREATE TYPE "RoleShop" AS ENUM ('SHOP', 'WRITER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('Clothing', 'Electronic', 'Furniture');

-- CreateEnum
CREATE TYPE "DiscountAppliesTo" AS ENUM ('all', 'specific');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "shop_email" TEXT NOT NULL,
    "shop_password" TEXT NOT NULL,
    "shop_salt" TEXT NOT NULL,
    "shop_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_tokens" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "roles" "AccountRole" NOT NULL,

    CONSTRAINT "key_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens_used" (
    "id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "refresh_token_use" TEXT NOT NULL,

    CONSTRAINT "refresh_tokens_used_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "permission" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_thumb" TEXT NOT NULL,
    "product_description" TEXT,
    "product_slug" TEXT,
    "product_price" DOUBLE PRECISION NOT NULL,
    "product_quantity" INTEGER NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "product_shop" TEXT NOT NULL,
    "product_ratingsAverage" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "product_variation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clothes" (
    "id" TEXT NOT NULL,
    "clothing_brand" TEXT NOT NULL,
    "clothing_size" TEXT NOT NULL,
    "clothing_material" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clothes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electronics" (
    "id" TEXT NOT NULL,
    "electronic_manufacturer" TEXT NOT NULL,
    "electronic_model" TEXT NOT NULL,
    "electronic_color" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electronics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furnitures" (
    "id" TEXT NOT NULL,
    "furniture_brand" TEXT NOT NULL,
    "furniture_size" TEXT NOT NULL,
    "furniture_material" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furnitures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "inventory_product_id" TEXT NOT NULL,
    "inventory_location" TEXT NOT NULL DEFAULT 'unKnow',
    "inventory_stock" INTEGER NOT NULL,
    "inventory_reservations" JSONB[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "discount_name" TEXT NOT NULL,
    "discount_description" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL DEFAULT 'fixed_amount',
    "discount_value" DOUBLE PRECISION NOT NULL,
    "discount_code" TEXT NOT NULL,
    "discount_start_dates" TIMESTAMP(3) NOT NULL,
    "discount_end_dates" TIMESTAMP(3) NOT NULL,
    "discount_max_uses" INTEGER NOT NULL,
    "discount_uses_count" INTEGER NOT NULL,
    "discount_users_used" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "discount_max_uses_per_user" INTEGER NOT NULL,
    "discount_min_order_value" DOUBLE PRECISION NOT NULL,
    "discount_shop" TEXT NOT NULL,
    "discount_is_active" BOOLEAN NOT NULL DEFAULT true,
    "discount_applies_to" "DiscountAppliesTo" NOT NULL,
    "discount_product_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "cart_state" "CartState" NOT NULL DEFAULT 'ACTIVE',
    "cart_count_product" INTEGER NOT NULL DEFAULT 0,
    "cart_userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_products" (
    "id" TEXT NOT NULL,
    "cart_product_productId" TEXT NOT NULL,
    "cart_product_shopId" TEXT NOT NULL,
    "cart_product_quantity" INTEGER NOT NULL,
    "cart_product_name" TEXT NOT NULL,
    "cart_product_price" DOUBLE PRECISION NOT NULL,
    "cart_product_cartId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_userId" TEXT NOT NULL,
    "order_checkout" JSONB NOT NULL,
    "order_payment" JSONB NOT NULL,
    "order_product" JSONB[],
    "order_tracking_number" TEXT NOT NULL DEFAULT '''#0000127032024',
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "comment_product" TEXT NOT NULL,
    "comment_user" TEXT NOT NULL,
    "comment_content" TEXT NOT NULL,
    "comment_left" INTEGER NOT NULL DEFAULT 0,
    "comment_right" INTEGER NOT NULL DEFAULT 0,
    "comment_parent_id" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_password" TEXT NOT NULL,
    "user_salt" TEXT NOT NULL,
    "user_phone" TEXT NOT NULL,
    "user_sex" "Sex" NOT NULL,
    "user_avatar" TEXT NOT NULL,
    "user_date_of_birth" TIMESTAMP(3) NOT NULL,
    "user_status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdProduct" (
    "id" TEXT NOT NULL,
    "sd_product_name" TEXT NOT NULL DEFAULT '',
    "sd_product_desc" TEXT NOT NULL DEFAULT '',
    "sd_product_status" INTEGER NOT NULL,
    "sd_product_attributes" JSONB NOT NULL,
    "sd_product_shop_id" TEXT NOT NULL,
    "isDeleted" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SdProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku" (
    "id" TEXT NOT NULL,
    "sku_no" TEXT NOT NULL DEFAULT '',
    "sku_description" TEXT NOT NULL,
    "sku_type" INTEGER NOT NULL,
    "sku_status" INTEGER NOT NULL,
    "sku_sort" INTEGER NOT NULL,
    "sku_stock" INTEGER NOT NULL DEFAULT 0,
    "sku_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_id_key" ON "shops"("id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_shop_email_key" ON "shops"("shop_email");

-- CreateIndex
CREATE UNIQUE INDEX "key_tokens_id_key" ON "key_tokens"("id");

-- CreateIndex
CREATE UNIQUE INDEX "key_tokens_account_id_key" ON "key_tokens"("account_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_used_refresh_token_idx" ON "refresh_tokens_used"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_id_key" ON "api_keys"("id");

-- CreateIndex
CREATE UNIQUE INDEX "products_id_key" ON "products"("id");

-- CreateIndex
CREATE INDEX "products_product_name_product_description_idx" ON "products"("product_name", "product_description");

-- CreateIndex
CREATE UNIQUE INDEX "clothes_id_key" ON "clothes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "clothes_product_id_key" ON "clothes"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "electronics_id_key" ON "electronics"("id");

-- CreateIndex
CREATE UNIQUE INDEX "electronics_product_id_key" ON "electronics"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "furnitures_id_key" ON "furnitures"("id");

-- CreateIndex
CREATE UNIQUE INDEX "furnitures_product_id_key" ON "furnitures"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_id_key" ON "inventories"("id");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_inventory_product_id_key" ON "inventories"("inventory_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_id_key" ON "discounts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_discount_code_key" ON "discounts"("discount_code");

-- CreateIndex
CREATE UNIQUE INDEX "carts_id_key" ON "carts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_cart_userId_key" ON "carts"("cart_userId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_products_id_key" ON "cart_products"("id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_products_cart_product_cartId_cart_product_productId_key" ON "cart_products"("cart_product_cartId", "cart_product_productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_id_key" ON "orders"("id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_userId_key" ON "orders"("order_userId");

-- CreateIndex
CREATE UNIQUE INDEX "comments_id_key" ON "comments"("id");

-- CreateIndex
CREATE UNIQUE INDEX "comments_comment_product_key" ON "comments"("comment_product");

-- CreateIndex
CREATE UNIQUE INDEX "comments_comment_user_key" ON "comments"("comment_user");

-- CreateIndex
CREATE UNIQUE INDEX "comments_comment_parent_id_key" ON "comments"("comment_parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_key" ON "users"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_phone_key" ON "users"("user_phone");

-- CreateIndex
CREATE UNIQUE INDEX "SdProduct_id_key" ON "SdProduct"("id");

-- CreateIndex
CREATE UNIQUE INDEX "sku_id_key" ON "sku"("id");

-- AddForeignKey
ALTER TABLE "refresh_tokens_used" ADD CONSTRAINT "refresh_tokens_used_refresh_token_use_fkey" FOREIGN KEY ("refresh_token_use") REFERENCES "key_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_shop_fkey" FOREIGN KEY ("product_shop") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clothes" ADD CONSTRAINT "clothes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electronics" ADD CONSTRAINT "electronics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furnitures" ADD CONSTRAINT "furnitures_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_inventory_product_id_fkey" FOREIGN KEY ("inventory_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_discount_shop_fkey" FOREIGN KEY ("discount_shop") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_cart_userId_fkey" FOREIGN KEY ("cart_userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_products" ADD CONSTRAINT "cart_products_cart_product_cartId_fkey" FOREIGN KEY ("cart_product_cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_userId_fkey" FOREIGN KEY ("order_userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_comment_product_fkey" FOREIGN KEY ("comment_product") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_comment_user_fkey" FOREIGN KEY ("comment_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
