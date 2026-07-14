-- Flyway current-schema baseline for NEW EMPTY disposable databases only.
-- Existing databases must be explicitly baselined at version 20251230040704;
-- do not execute this DDL over an existing schema.
-- Generated from the verified schema-only local PostgreSQL snapshot on
-- 2026-06-29. It intentionally contains no data, owners, or privileges.
--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AccountRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountRole" AS ENUM (
    'SHOP',
    'USER'
);


--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountType" AS ENUM (
    'USER',
    'SHOP',
    'ADMIN',
    'SUPER_ADMIN'
);


--
-- Name: AdminLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AdminLevel" AS ENUM (
    'JUNIOR',
    'SENIOR',
    'MANAGER',
    'DIRECTOR',
    'SUPER'
);


--
-- Name: AuthMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuthMethod" AS ENUM (
    'EMAIL_PASSWORD',
    'OAUTH2_ONLY',
    'HYBRID'
);


--
-- Name: CartState; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CartState" AS ENUM (
    'ACTIVE',
    'COMPLETE',
    'FAIL',
    'PENDING'
);


--
-- Name: CommentAuthorType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommentAuthorType" AS ENUM (
    'USER',
    'SHOP',
    'ADMIN',
    'SYSTEM'
);


--
-- Name: CommentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommentStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'PENDING',
    'REJECTED',
    'HIDDEN',
    'SPAM'
);


--
-- Name: CommentTargetType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommentTargetType" AS ENUM (
    'PRODUCT',
    'ORDER',
    'REVIEW',
    'SHOP',
    'BLOG_POST',
    'ANNOUNCEMENT'
);


--
-- Name: CommentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommentType" AS ENUM (
    'TEXT',
    'HTML',
    'MARKDOWN'
);


--
-- Name: DiscountAppliesTo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DiscountAppliesTo" AS ENUM (
    'all',
    'specific'
);


--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MessageType" AS ENUM (
    'USER_TO_SHOP',
    'SHOP_TO_USER'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'PRODUCT',
    'DISCOUNT'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'SHIPPED',
    'CANCELLED',
    'DELIVERED'
);


--
-- Name: RoleShop; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RoleShop" AS ENUM (
    'SHOP',
    'WRITER',
    'EDITOR',
    'ADMIN'
);


--
-- Name: Sex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Sex" AS ENUM (
    'MALE',
    'FEMALE'
);


--
-- Name: Status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Status" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING'
);


--
-- Name: UserSocialProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserSocialProvider" AS ENUM (
    'GOOGLE',
    'FACEBOOK'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Brand; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    image character varying(1000) DEFAULT ''::character varying NOT NULL,
    initial character varying(1) DEFAULT ''::character varying NOT NULL,
    sort integer DEFAULT 10,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name character varying(50),
    sort integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: CategoryAttr; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CategoryAttr" (
    "categoryId" text NOT NULL,
    "attrId" text NOT NULL
);


--
-- Name: CategoryBrand; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CategoryBrand" (
    "categoryId" text NOT NULL,
    "brandId" text NOT NULL
);


--
-- Name: CategoryClosureTable; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CategoryClosureTable" (
    "ancestorId" text NOT NULL,
    "descendantId" text NOT NULL,
    depth integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: DeviceSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DeviceSession" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "deviceId" text NOT NULL,
    "deviceName" text,
    "lastLogin" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: Sku; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sku" (
    id text NOT NULL,
    name character varying(200) NOT NULL,
    price integer DEFAULT 1 NOT NULL,
    num integer DEFAULT 100,
    image character varying(200),
    images character varying(2000)[],
    "spuId" character varying(60) NOT NULL,
    "brandName" character varying(100),
    "skuAttribute" character varying(200),
    status integer DEFAULT 1,
    inventory_id text,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: SkuAttribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SkuAttribute" (
    id text NOT NULL,
    name character varying(50),
    options character varying(2000),
    sort integer
);


--
-- Name: Spu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Spu" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    intro character varying(200),
    "brandId" text NOT NULL,
    "categoryId" text NOT NULL,
    images character varying(1000)[],
    "afterSalesService" character varying(50),
    content text,
    "attributeList" character varying(3000),
    "isMarketable" boolean DEFAULT false NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "shopBusinessId" text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: account_authentication; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_authentication (
    "accountId" text NOT NULL,
    username text,
    email text NOT NULL,
    password_hash text,
    password_salt text,
    auth_method public."AuthMethod" DEFAULT 'EMAIL_PASSWORD'::public."AuthMethod" NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    last_login_at bigint,
    login_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: account_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_preferences (
    "accountId" text NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    sms_notifications boolean DEFAULT false NOT NULL,
    push_notifications boolean DEFAULT true NOT NULL,
    profile_visibility text DEFAULT 'public'::text NOT NULL,
    data_sharing boolean DEFAULT false NOT NULL,
    theme text DEFAULT 'light'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: account_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_profiles (
    "accountId" text NOT NULL,
    name text NOT NULL,
    avatar text,
    phone text,
    address text,
    timezone text,
    language text DEFAULT 'en'::text,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: account_security; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_security (
    "accountId" text NOT NULL,
    roles text[],
    permissions text[],
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret text,
    backup_codes text[],
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_until bigint,
    suspicious_activity boolean DEFAULT false NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    account_type public."AccountType" NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: admin_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_access (
    "accountId" text NOT NULL,
    department text NOT NULL,
    "position" text NOT NULL,
    admin_level public."AdminLevel" NOT NULL,
    supervisor text,
    modules text[],
    territories text[],
    last_activity bigint,
    actions_today integer DEFAULT 0 NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: admin_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_activity_logs (
    id text NOT NULL,
    admin_id text NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text NOT NULL,
    details jsonb,
    ip_address text,
    created_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: cart_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_products (
    id text NOT NULL,
    "cart_product_productId" text NOT NULL,
    "cart_product_shopId" text NOT NULL,
    cart_product_quantity integer NOT NULL,
    cart_product_name text NOT NULL,
    cart_product_price double precision NOT NULL,
    "cart_product_cartId" text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id text NOT NULL,
    cart_state public."CartState" DEFAULT 'ACTIVE'::public."CartState" NOT NULL,
    cart_count_product integer DEFAULT 0 NOT NULL,
    "cart_userId" text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: comment_closure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_closure (
    "ancestorId" text NOT NULL,
    "descendantId" text NOT NULL,
    depth integer NOT NULL
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL,
    author_id text NOT NULL,
    author_type public."CommentAuthorType" DEFAULT 'USER'::public."CommentAuthorType" NOT NULL,
    content text NOT NULL,
    content_type public."CommentType" DEFAULT 'TEXT'::public."CommentType" NOT NULL,
    dislikes_count integer DEFAULT 0 NOT NULL,
    edited_at bigint,
    ip_address text DEFAULT '127.0.0.1'::text,
    is_edited boolean DEFAULT false NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    likes_count integer DEFAULT 0 NOT NULL,
    replies_count integer DEFAULT 0 NOT NULL,
    spu_id text NOT NULL,
    status public."CommentStatus" DEFAULT 'PUBLISHED'::public."CommentStatus" NOT NULL,
    target_id text NOT NULL,
    target_type public."CommentTargetType" NOT NULL,
    thread_id text,
    user_agent text
);


--
-- Name: discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discounts (
    id text NOT NULL,
    discount_name text NOT NULL,
    discount_description text NOT NULL,
    discount_type text DEFAULT 'fixed_amount'::text NOT NULL,
    discount_value double precision NOT NULL,
    discount_code text NOT NULL,
    discount_start_dates timestamp(3) without time zone NOT NULL,
    discount_end_dates timestamp(3) without time zone NOT NULL,
    discount_max_uses integer NOT NULL,
    discount_uses_count integer NOT NULL,
    discount_users_used text[] DEFAULT ARRAY[]::text[],
    discount_max_uses_per_user integer NOT NULL,
    discount_min_order_value double precision NOT NULL,
    discount_shop text NOT NULL,
    discount_is_active boolean DEFAULT true NOT NULL,
    discount_applies_to public."DiscountAppliesTo" NOT NULL,
    discount_product_ids text[] DEFAULT ARRAY[]::text[],
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: inventories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventories (
    id text NOT NULL,
    inventory_product_id text NOT NULL,
    inventory_location text DEFAULT 'unKnow'::text NOT NULL,
    inventory_stock integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL,
    "shopBusinessId" text NOT NULL
);


--
-- Name: key_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_tokens (
    id text NOT NULL,
    public_key text NOT NULL,
    refresh_token text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL,
    auth_id text NOT NULL,
    device_id text NOT NULL,
    expires_at bigint
);


--
-- Name: notification_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_threads (
    id text NOT NULL,
    noti_thread_user_id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    noti_type public."NotificationType" NOT NULL,
    noti_sender_id text NOT NULL,
    noti_thread_id text NOT NULL,
    noti_content text NOT NULL,
    noti_option jsonb NOT NULL,
    notification_status text DEFAULT 'unread'::text NOT NULL,
    noti_product_id text,
    noti_discount_id text,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "inventoryId" text NOT NULL,
    quantity integer NOT NULL,
    price integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL,
    expired_at timestamp(3) without time zone NOT NULL,
    payment_info jsonb NOT NULL,
    payment_intent_id text,
    shipping_fee numeric(65,30) NOT NULL,
    shipping_street text NOT NULL,
    "shopBusinessId" text NOT NULL,
    status public."OrderStatus" NOT NULL,
    "total_discount " numeric(65,30) NOT NULL,
    total_price numeric(65,30) NOT NULL,
    user_id text NOT NULL
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id text NOT NULL,
    auth_id text NOT NULL,
    token text NOT NULL,
    token_hash text NOT NULL,
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    ip_address text,
    user_agent text,
    is_used boolean DEFAULT false NOT NULL,
    used_at timestamp(3) without time zone,
    used_ip_address text,
    used_user_agent text,
    attempt_count integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 5 NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: refresh_tokens_used; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens_used (
    id text NOT NULL,
    refresh_token text NOT NULL,
    used_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_agent text,
    ip_address text,
    created_at bigint DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL,
    device_info text,
    key_token_id text NOT NULL,
    reason text
);


--
-- Name: reservation_inventories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservation_inventories (
    id text NOT NULL,
    inventory_id text NOT NULL,
    user_id text NOT NULL,
    quantity integer NOT NULL,
    expired_at timestamp(3) without time zone NOT NULL,
    "isConfirmed" boolean DEFAULT false NOT NULL,
    valid boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: shop_business; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_business (
    "accountId" text NOT NULL,
    business_name text NOT NULL,
    business_type text NOT NULL,
    tax_id text,
    business_address text,
    total_sales numeric(65,30) DEFAULT 0 NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    rating double precision DEFAULT 0,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: social_authentication; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_authentication (
    id text NOT NULL,
    auth_id text NOT NULL,
    provider text NOT NULL,
    provider_id text NOT NULL,
    provider_email text,
    access_token text,
    refresh_token text,
    expires_at bigint,
    is_active boolean DEFAULT true NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: user_behavior; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_behavior (
    "accountId" text NOT NULL,
    loyalty_points integer DEFAULT 0 NOT NULL,
    membership_tier text DEFAULT 'bronze'::text,
    sex public."Sex" DEFAULT 'FEMALE'::public."Sex" NOT NULL,
    preferences jsonb,
    date_of_birth timestamp(3) without time zone NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: CategoryAttr CategoryAttr_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryAttr"
    ADD CONSTRAINT "CategoryAttr_pkey" PRIMARY KEY ("categoryId", "attrId");


--
-- Name: CategoryBrand CategoryBrand_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryBrand"
    ADD CONSTRAINT "CategoryBrand_pkey" PRIMARY KEY ("brandId", "categoryId");


--
-- Name: CategoryClosureTable CategoryClosureTable_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryClosureTable"
    ADD CONSTRAINT "CategoryClosureTable_pkey" PRIMARY KEY ("ancestorId", "descendantId");


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: DeviceSession DeviceSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceSession"
    ADD CONSTRAINT "DeviceSession_pkey" PRIMARY KEY (id);


--
-- Name: SkuAttribute SkuAttribute_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SkuAttribute"
    ADD CONSTRAINT "SkuAttribute_pkey" PRIMARY KEY (id);


--
-- Name: Sku Sku_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sku"
    ADD CONSTRAINT "Sku_pkey" PRIMARY KEY (id);


--
-- Name: Spu Spu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spu"
    ADD CONSTRAINT "Spu_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account_authentication account_authentication_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_authentication
    ADD CONSTRAINT account_authentication_pkey PRIMARY KEY ("accountId");


--
-- Name: account_preferences account_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_preferences
    ADD CONSTRAINT account_preferences_pkey PRIMARY KEY ("accountId");


--
-- Name: account_profiles account_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_profiles
    ADD CONSTRAINT account_profiles_pkey PRIMARY KEY ("accountId");


--
-- Name: account_security account_security_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_security
    ADD CONSTRAINT account_security_pkey PRIMARY KEY ("accountId");


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_access admin_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_access
    ADD CONSTRAINT admin_access_pkey PRIMARY KEY ("accountId");


--
-- Name: admin_activity_logs admin_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: cart_products cart_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_products
    ADD CONSTRAINT cart_products_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: comment_closure comment_closure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_closure
    ADD CONSTRAINT comment_closure_pkey PRIMARY KEY ("ancestorId", "descendantId");


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (id);


--
-- Name: inventories inventories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_pkey PRIMARY KEY (id);


--
-- Name: key_tokens key_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_tokens
    ADD CONSTRAINT key_tokens_pkey PRIMARY KEY (id);


--
-- Name: notification_threads notification_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_threads
    ADD CONSTRAINT notification_threads_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens_used refresh_tokens_used_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens_used
    ADD CONSTRAINT refresh_tokens_used_pkey PRIMARY KEY (id);


--
-- Name: reservation_inventories reservation_inventories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_inventories
    ADD CONSTRAINT reservation_inventories_pkey PRIMARY KEY (id);


--
-- Name: shop_business shop_business_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_business
    ADD CONSTRAINT shop_business_pkey PRIMARY KEY ("accountId");


--
-- Name: social_authentication social_authentication_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_authentication
    ADD CONSTRAINT social_authentication_pkey PRIMARY KEY (id);


--
-- Name: user_behavior user_behavior_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_behavior
    ADD CONSTRAINT user_behavior_pkey PRIMARY KEY ("accountId");


--
-- Name: Brand_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Brand_name_key" ON public."Brand" USING btree (name);


--
-- Name: DeviceSession_deviceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DeviceSession_deviceId_key" ON public."DeviceSession" USING btree ("deviceId");


--
-- Name: Sku_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Sku_status_idx" ON public."Sku" USING btree (status);


--
-- Name: Spu_name_brandId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Spu_name_brandId_key" ON public."Spu" USING btree (name, "brandId");


--
-- Name: Spu_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Spu_name_key" ON public."Spu" USING btree (name);


--
-- Name: account_authentication_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX account_authentication_email_key ON public.account_authentication USING btree (email);


--
-- Name: account_authentication_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX account_authentication_username_key ON public.account_authentication USING btree (username);


--
-- Name: account_profiles_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX account_profiles_phone_key ON public.account_profiles USING btree (phone);


--
-- Name: cart_products_cart_product_cartId_cart_product_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "cart_products_cart_product_cartId_cart_product_productId_key" ON public.cart_products USING btree ("cart_product_cartId", "cart_product_productId");


--
-- Name: carts_cart_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "carts_cart_userId_key" ON public.carts USING btree ("cart_userId");


--
-- Name: discounts_discount_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX discounts_discount_code_key ON public.discounts USING btree (discount_code);


--
-- Name: inventories_inventory_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inventories_inventory_product_id_key ON public.inventories USING btree (inventory_product_id);


--
-- Name: key_tokens_auth_id_device_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX key_tokens_auth_id_device_id_key ON public.key_tokens USING btree (auth_id, device_id);


--
-- Name: notification_threads_noti_thread_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notification_threads_noti_thread_user_id_key ON public.notification_threads USING btree (noti_thread_user_id);


--
-- Name: password_resets_auth_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_resets_auth_id_idx ON public.password_resets USING btree (auth_id);


--
-- Name: password_resets_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_resets_expires_at_idx ON public.password_resets USING btree (expires_at);


--
-- Name: password_resets_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_resets_token_idx ON public.password_resets USING btree (token);


--
-- Name: password_resets_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_resets_token_key ON public.password_resets USING btree (token);


--
-- Name: refresh_tokens_used_key_token_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_used_key_token_id_idx ON public.refresh_tokens_used USING btree (key_token_id);


--
-- Name: refresh_tokens_used_refresh_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_used_refresh_token_idx ON public.refresh_tokens_used USING btree (refresh_token);


--
-- Name: reservation_inventories_inventory_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reservation_inventories_inventory_id_user_id_key ON public.reservation_inventories USING btree (inventory_id, user_id);


--
-- Name: social_authentication_auth_id_provider_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX social_authentication_auth_id_provider_key ON public.social_authentication USING btree (auth_id, provider);


--
-- Name: social_authentication_provider_provider_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX social_authentication_provider_provider_id_key ON public.social_authentication USING btree (provider, provider_id);


--
-- Name: updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX updated ON public."Sku" USING btree (updated_at);


--
-- Name: CategoryAttr CategoryAttr_attrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryAttr"
    ADD CONSTRAINT "CategoryAttr_attrId_fkey" FOREIGN KEY ("attrId") REFERENCES public."SkuAttribute"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CategoryAttr CategoryAttr_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryAttr"
    ADD CONSTRAINT "CategoryAttr_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CategoryBrand CategoryBrand_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryBrand"
    ADD CONSTRAINT "CategoryBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CategoryBrand CategoryBrand_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryBrand"
    ADD CONSTRAINT "CategoryBrand_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CategoryClosureTable CategoryClosureTable_ancestorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryClosureTable"
    ADD CONSTRAINT "CategoryClosureTable_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CategoryClosureTable CategoryClosureTable_descendantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CategoryClosureTable"
    ADD CONSTRAINT "CategoryClosureTable_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeviceSession DeviceSession_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceSession"
    ADD CONSTRAINT "DeviceSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sku Sku_spuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sku"
    ADD CONSTRAINT "Sku_spuId_fkey" FOREIGN KEY ("spuId") REFERENCES public."Spu"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Spu Spu_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spu"
    ADD CONSTRAINT "Spu_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Spu Spu_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spu"
    ADD CONSTRAINT "Spu_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Spu Spu_shopBusinessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spu"
    ADD CONSTRAINT "Spu_shopBusinessId_fkey" FOREIGN KEY ("shopBusinessId") REFERENCES public.shop_business("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: account_authentication account_authentication_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_authentication
    ADD CONSTRAINT "account_authentication_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: account_preferences account_preferences_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_preferences
    ADD CONSTRAINT "account_preferences_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: account_profiles account_profiles_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_profiles
    ADD CONSTRAINT "account_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: account_security account_security_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_security
    ADD CONSTRAINT "account_security_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: admin_access admin_access_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_access
    ADD CONSTRAINT "admin_access_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: admin_activity_logs admin_activity_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_access("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_products cart_products_cart_product_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_products
    ADD CONSTRAINT "cart_products_cart_product_cartId_fkey" FOREIGN KEY ("cart_product_cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: carts carts_cart_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_cart_userId_fkey" FOREIGN KEY ("cart_userId") REFERENCES public.user_behavior("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comment_closure comment_closure_ancestorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_closure
    ADD CONSTRAINT "comment_closure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comment_closure comment_closure_descendantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_closure
    ADD CONSTRAINT "comment_closure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comments comments_spu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_spu_id_fkey FOREIGN KEY (spu_id) REFERENCES public."Spu"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: discounts discounts_discount_shop_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_discount_shop_fkey FOREIGN KEY (discount_shop) REFERENCES public.shop_business("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventories inventories_inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_inventory_product_id_fkey FOREIGN KEY (inventory_product_id) REFERENCES public."Sku"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventories inventories_shopBusinessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT "inventories_shopBusinessId_fkey" FOREIGN KEY ("shopBusinessId") REFERENCES public.shop_business("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: key_tokens key_tokens_auth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_tokens
    ADD CONSTRAINT key_tokens_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.account_authentication("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notification_threads notification_threads_noti_thread_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_threads
    ADD CONSTRAINT notification_threads_noti_thread_user_id_fkey FOREIGN KEY (noti_thread_user_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_noti_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_noti_sender_id_fkey FOREIGN KEY (noti_sender_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_noti_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_noti_thread_id_fkey FOREIGN KEY (noti_thread_id) REFERENCES public.notification_threads(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_inventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public.inventories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_shopBusinessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_shopBusinessId_fkey" FOREIGN KEY ("shopBusinessId") REFERENCES public.shop_business("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_behavior("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: password_resets password_resets_auth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.account_authentication("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refresh_tokens_used refresh_tokens_used_key_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens_used
    ADD CONSTRAINT refresh_tokens_used_key_token_id_fkey FOREIGN KEY (key_token_id) REFERENCES public.key_tokens(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reservation_inventories reservation_inventories_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_inventories
    ADD CONSTRAINT reservation_inventories_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shop_business shop_business_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_business
    ADD CONSTRAINT "shop_business_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: social_authentication social_authentication_auth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_authentication
    ADD CONSTRAINT social_authentication_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.account_authentication("accountId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_behavior user_behavior_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_behavior
    ADD CONSTRAINT "user_behavior_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--
