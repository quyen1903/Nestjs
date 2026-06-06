CREATE TYPE "public"."AccountRole" AS ENUM('SHOP', 'USER');--> statement-breakpoint
CREATE TYPE "public"."AccountType" AS ENUM('USER', 'SHOP', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."AdminLevel" AS ENUM('JUNIOR', 'SENIOR', 'MANAGER', 'DIRECTOR', 'SUPER');--> statement-breakpoint
CREATE TYPE "public"."AuthMethod" AS ENUM('EMAIL_PASSWORD', 'OAUTH2_ONLY', 'HYBRID');--> statement-breakpoint
CREATE TYPE "public"."CartState" AS ENUM('ACTIVE', 'COMPLETE', 'FAIL', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."CommentAuthorType" AS ENUM('USER', 'SHOP', 'ADMIN', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."CommentStatus" AS ENUM('DRAFT', 'PUBLISHED', 'PENDING', 'REJECTED', 'HIDDEN', 'SPAM');--> statement-breakpoint
CREATE TYPE "public"."CommentTargetType" AS ENUM('PRODUCT', 'ORDER', 'REVIEW', 'SHOP', 'BLOG_POST', 'ANNOUNCEMENT');--> statement-breakpoint
CREATE TYPE "public"."CommentType" AS ENUM('TEXT', 'HTML', 'MARKDOWN');--> statement-breakpoint
CREATE TYPE "public"."DiscountAppliesTo" AS ENUM('all', 'specific');--> statement-breakpoint
CREATE TYPE "public"."MessageType" AS ENUM('USER_TO_SHOP', 'SHOP_TO_USER');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('PRODUCT', 'DISCOUNT');--> statement-breakpoint
CREATE TYPE "public"."OrderStatus" AS ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'DELIVERED');--> statement-breakpoint
CREATE TYPE "public"."RoleShop" AS ENUM('SHOP', 'WRITER', 'EDITOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."Sex" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."Status" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."UserSocialProvider" AS ENUM('GOOGLE', 'FACEBOOK');--> statement-breakpoint
CREATE TABLE "account_authentication" (
	"accountId" text PRIMARY KEY NOT NULL,
	"username" text,
	"email" text NOT NULL,
	"password_hash" text,
	"password_salt" text,
	"auth_method" "AuthMethod" DEFAULT 'EMAIL_PASSWORD' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" bigint,
	"login_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_preferences" (
	"accountId" text PRIMARY KEY NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"sms_notifications" boolean DEFAULT false NOT NULL,
	"push_notifications" boolean DEFAULT true NOT NULL,
	"profile_visibility" text DEFAULT 'public' NOT NULL,
	"data_sharing" boolean DEFAULT false NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_profiles" (
	"accountId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"phone" text,
	"address" text,
	"timezone" text,
	"language" text DEFAULT 'en',
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_security" (
	"accountId" text PRIMARY KEY NOT NULL,
	"roles" text[],
	"permissions" text[],
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"backup_codes" text[],
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" bigint,
	"suspicious_activity" boolean DEFAULT false NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_type" "AccountType" NOT NULL,
	"status" "Status" DEFAULT 'ACTIVE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_access" (
	"accountId" text PRIMARY KEY NOT NULL,
	"department" text NOT NULL,
	"position" text NOT NULL,
	"admin_level" "AdminLevel" NOT NULL,
	"supervisor" text,
	"modules" text[],
	"territories" text[],
	"last_activity" bigint,
	"actions_today" integer DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Brand" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"image" varchar(1000) DEFAULT '' NOT NULL,
	"initial" varchar(1) DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 10,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_products" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_product_productId" text NOT NULL,
	"cart_product_shopId" text NOT NULL,
	"cart_product_quantity" integer NOT NULL,
	"cart_product_name" text NOT NULL,
	"cart_product_price" double precision NOT NULL,
	"cart_product_cartId" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_state" "CartState" DEFAULT 'ACTIVE' NOT NULL,
	"cart_count_product" integer DEFAULT 0 NOT NULL,
	"cart_userId" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(50),
	"sort" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CategoryAttr" (
	"categoryId" text NOT NULL,
	"attrId" text NOT NULL,
	CONSTRAINT "CategoryAttr_categoryId_attrId_pk" PRIMARY KEY("categoryId","attrId")
);
--> statement-breakpoint
CREATE TABLE "CategoryBrand" (
	"categoryId" text NOT NULL,
	"brandId" text NOT NULL,
	CONSTRAINT "CategoryBrand_brandId_categoryId_pk" PRIMARY KEY("brandId","categoryId")
);
--> statement-breakpoint
CREATE TABLE "CategoryClosureTable" (
	"ancestorId" text NOT NULL,
	"descendantId" text NOT NULL,
	"depth" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "CategoryClosureTable_ancestorId_descendantId_pk" PRIMARY KEY("ancestorId","descendantId")
);
--> statement-breakpoint
CREATE TABLE "comment_closure" (
	"ancestorId" text NOT NULL,
	"descendantId" text NOT NULL,
	"depth" integer NOT NULL,
	CONSTRAINT "comment_closure_ancestorId_descendantId_pk" PRIMARY KEY("ancestorId","descendantId")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"content_type" "CommentType" DEFAULT 'TEXT' NOT NULL,
	"target_type" "CommentTargetType" NOT NULL,
	"target_id" text NOT NULL,
	"author_id" text NOT NULL,
	"author_type" "CommentAuthorType" DEFAULT 'USER' NOT NULL,
	"thread_id" text,
	"status" "CommentStatus" DEFAULT 'PUBLISHED' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" bigint,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"dislikes_count" integer DEFAULT 0 NOT NULL,
	"replies_count" integer DEFAULT 0 NOT NULL,
	"ip_address" text DEFAULT '127.0.0.1',
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	"spu_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DeviceSession" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"deviceId" text NOT NULL,
	"deviceName" text,
	"lastLogin" timestamp (3) DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" text PRIMARY KEY NOT NULL,
	"discount_name" text NOT NULL,
	"discount_description" text NOT NULL,
	"discount_type" text DEFAULT 'fixed_amount' NOT NULL,
	"discount_value" double precision NOT NULL,
	"discount_code" text NOT NULL,
	"discount_start_dates" timestamp (3) NOT NULL,
	"discount_end_dates" timestamp (3) NOT NULL,
	"discount_max_uses" integer NOT NULL,
	"discount_uses_count" integer NOT NULL,
	"discount_users_used" text[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
	"discount_max_uses_per_user" integer NOT NULL,
	"discount_min_order_value" double precision NOT NULL,
	"discount_shop" text NOT NULL,
	"discount_is_active" boolean DEFAULT true NOT NULL,
	"discount_applies_to" "DiscountAppliesTo" NOT NULL,
	"discount_product_ids" text[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventories" (
	"id" text PRIMARY KEY NOT NULL,
	"inventory_location" text DEFAULT 'unKnow' NOT NULL,
	"inventory_stock" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	"inventory_product_id" text NOT NULL,
	"shopBusinessId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_id" text NOT NULL,
	"device_id" text NOT NULL,
	"public_key" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" bigint,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"noti_thread_user_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"noti_type" "NotificationType" NOT NULL,
	"noti_sender_id" text NOT NULL,
	"noti_thread_id" text NOT NULL,
	"noti_content" text NOT NULL,
	"noti_option" jsonb NOT NULL,
	"notification_status" text DEFAULT 'unread' NOT NULL,
	"noti_product_id" text,
	"noti_discount_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"inventoryId" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "OrderStatus" NOT NULL,
	"total_discount " numeric(65, 30) NOT NULL,
	"shipping_fee" numeric(65, 30) NOT NULL,
	"shipping_street" text NOT NULL,
	"total_price" numeric(65, 30) NOT NULL,
	"payment_info" jsonb NOT NULL,
	"payment_intent_id" text,
	"expired_at" timestamp (3) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	"shopBusinessId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_id" text NOT NULL,
	"token" text NOT NULL,
	"token_hash" text NOT NULL,
	"requested_at" timestamp (3) DEFAULT now() NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp (3),
	"used_ip_address" text,
	"used_user_agent" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens_used" (
	"id" text PRIMARY KEY NOT NULL,
	"key_token_id" text NOT NULL,
	"refresh_token" text NOT NULL,
	"used_at" timestamp (3) DEFAULT now() NOT NULL,
	"reason" text,
	"user_agent" text,
	"ip_address" text,
	"device_info" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_inventories" (
	"id" text PRIMARY KEY NOT NULL,
	"inventory_id" text NOT NULL,
	"user_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"expired_at" timestamp (3) NOT NULL,
	"isConfirmed" boolean DEFAULT false NOT NULL,
	"valid" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_business" (
	"accountId" text PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"business_type" text NOT NULL,
	"tax_id" text,
	"business_address" text,
	"total_sales" numeric(65, 30) DEFAULT 0 NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"rating" double precision DEFAULT 0,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Sku" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"price" integer DEFAULT 1 NOT NULL,
	"num" integer DEFAULT 100,
	"image" varchar(200),
	"images" varchar(2000)[] NOT NULL,
	"spuId" varchar(60) NOT NULL,
	"brandName" varchar(100),
	"skuAttribute" varchar(200),
	"status" integer DEFAULT 1,
	"inventory_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SkuAttribute" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(50),
	"options" varchar(2000),
	"sort" integer
);
--> statement-breakpoint
CREATE TABLE "social_authentication" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_email" text,
	"access_token" text,
	"refresh_token" text,
	"expires_at" bigint,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Spu" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"intro" varchar(200),
	"brandId" text NOT NULL,
	"categoryId" text NOT NULL,
	"images" varchar(1000)[] NOT NULL,
	"afterSalesService" varchar(50),
	"content" text,
	"attributeList" varchar(3000),
	"isMarketable" boolean DEFAULT false NOT NULL,
	"status" integer DEFAULT 0 NOT NULL,
	"shopBusinessId" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_behavior" (
	"accountId" text PRIMARY KEY NOT NULL,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"membership_tier" text DEFAULT 'bronze',
	"sex" "Sex" DEFAULT 'FEMALE' NOT NULL,
	"preferences" jsonb,
	"date_of_birth" timestamp (3) NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_authentication" ADD CONSTRAINT "account_authentication_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account_preferences" ADD CONSTRAINT "account_preferences_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD CONSTRAINT "account_profiles_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account_security" ADD CONSTRAINT "account_security_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admin_access" ADD CONSTRAINT "admin_access_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_admin_access_accountId_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_access"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cart_products" ADD CONSTRAINT "cart_products_cart_product_cartId_carts_id_fk" FOREIGN KEY ("cart_product_cartId") REFERENCES "public"."carts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_cart_userId_user_behavior_accountId_fk" FOREIGN KEY ("cart_userId") REFERENCES "public"."user_behavior"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CategoryAttr" ADD CONSTRAINT "CategoryAttr_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CategoryAttr" ADD CONSTRAINT "CategoryAttr_attrId_SkuAttribute_id_fk" FOREIGN KEY ("attrId") REFERENCES "public"."SkuAttribute"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CategoryBrand" ADD CONSTRAINT "CategoryBrand_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CategoryBrand" ADD CONSTRAINT "CategoryBrand_brandId_Brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CategoryClosureTable" ADD CONSTRAINT "CategoryClosureTable_ancestorId_Category_id_fk" FOREIGN KEY ("ancestorId") REFERENCES "public"."Category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CategoryClosureTable" ADD CONSTRAINT "CategoryClosureTable_descendantId_Category_id_fk" FOREIGN KEY ("descendantId") REFERENCES "public"."Category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment_closure" ADD CONSTRAINT "comment_closure_ancestorId_comments_id_fk" FOREIGN KEY ("ancestorId") REFERENCES "public"."comments"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment_closure" ADD CONSTRAINT "comment_closure_descendantId_comments_id_fk" FOREIGN KEY ("descendantId") REFERENCES "public"."comments"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_accounts_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_spu_id_Spu_id_fk" FOREIGN KEY ("spu_id") REFERENCES "public"."Spu"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_discount_shop_shop_business_accountId_fk" FOREIGN KEY ("discount_shop") REFERENCES "public"."shop_business"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_inventory_product_id_Sku_id_fk" FOREIGN KEY ("inventory_product_id") REFERENCES "public"."Sku"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_shopBusinessId_shop_business_accountId_fk" FOREIGN KEY ("shopBusinessId") REFERENCES "public"."shop_business"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "key_tokens" ADD CONSTRAINT "key_tokens_auth_id_account_authentication_accountId_fk" FOREIGN KEY ("auth_id") REFERENCES "public"."account_authentication"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_threads" ADD CONSTRAINT "notification_threads_noti_thread_user_id_accounts_id_fk" FOREIGN KEY ("noti_thread_user_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_noti_sender_id_accounts_id_fk" FOREIGN KEY ("noti_sender_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_noti_thread_id_notification_threads_id_fk" FOREIGN KEY ("noti_thread_id") REFERENCES "public"."notification_threads"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_inventoryId_inventories_id_fk" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_behavior_accountId_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_behavior"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shopBusinessId_shop_business_accountId_fk" FOREIGN KEY ("shopBusinessId") REFERENCES "public"."shop_business"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_auth_id_account_authentication_accountId_fk" FOREIGN KEY ("auth_id") REFERENCES "public"."account_authentication"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "refresh_tokens_used" ADD CONSTRAINT "refresh_tokens_used_key_token_id_key_tokens_id_fk" FOREIGN KEY ("key_token_id") REFERENCES "public"."key_tokens"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reservation_inventories" ADD CONSTRAINT "reservation_inventories_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "shop_business" ADD CONSTRAINT "shop_business_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_spuId_Spu_id_fk" FOREIGN KEY ("spuId") REFERENCES "public"."Spu"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "social_authentication" ADD CONSTRAINT "social_authentication_auth_id_account_authentication_accountId_fk" FOREIGN KEY ("auth_id") REFERENCES "public"."account_authentication"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Spu" ADD CONSTRAINT "Spu_brandId_Brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Spu" ADD CONSTRAINT "Spu_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Spu" ADD CONSTRAINT "Spu_shopBusinessId_shop_business_accountId_fk" FOREIGN KEY ("shopBusinessId") REFERENCES "public"."shop_business"("accountId") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "account_authentication_username_key" ON "account_authentication" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "account_authentication_email_key" ON "account_authentication" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "account_profiles_phone_key" ON "account_profiles" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_products_cart_product_cartId_cart_product_productId_key" ON "cart_products" USING btree ("cart_product_cartId","cart_product_productId");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_cart_userId_key" ON "carts" USING btree ("cart_userId");--> statement-breakpoint
CREATE UNIQUE INDEX "DeviceSession_deviceId_key" ON "DeviceSession" USING btree ("deviceId");--> statement-breakpoint
CREATE UNIQUE INDEX "discounts_discount_code_key" ON "discounts" USING btree ("discount_code");--> statement-breakpoint
CREATE UNIQUE INDEX "inventories_inventory_product_id_key" ON "inventories" USING btree ("inventory_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "key_tokens_auth_id_device_id_key" ON "key_tokens" USING btree ("auth_id","device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_threads_noti_thread_user_id_key" ON "notification_threads" USING btree ("noti_thread_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_resets_token_idx" ON "password_resets" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_resets_auth_id_idx" ON "password_resets" USING btree ("auth_id");--> statement-breakpoint
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_used_refresh_token_idx" ON "refresh_tokens_used" USING btree ("refresh_token");--> statement-breakpoint
CREATE INDEX "refresh_tokens_used_key_token_id_idx" ON "refresh_tokens_used" USING btree ("key_token_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_inventories_inventory_id_user_id_key" ON "reservation_inventories" USING btree ("inventory_id","user_id");--> statement-breakpoint
CREATE INDEX "Sku_status_idx" ON "Sku" USING btree ("status");--> statement-breakpoint
CREATE INDEX "updated" ON "Sku" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "social_authentication_auth_id_provider_key" ON "social_authentication" USING btree ("auth_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "social_authentication_provider_provider_id_key" ON "social_authentication" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Spu_name_key" ON "Spu" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "Spu_name_brandId_key" ON "Spu" USING btree ("name","brandId");