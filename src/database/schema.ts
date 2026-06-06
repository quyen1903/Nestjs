import { randomUUID } from 'node:crypto';
import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

const textId = (name = 'id') => text(name).primaryKey().$defaultFn(() => randomUUID());
const createdAt = () => bigint('created_at', { mode: 'bigint' }).notNull().default(sql`0`);
const updatedAt = () => bigint('updated_at', { mode: 'bigint' }).notNull().default(sql`0`);
const isActive = () => boolean('is_active').notNull().default(true);

export const accountTypeEnum = pgEnum('AccountType', ['USER', 'SHOP', 'ADMIN', 'SUPER_ADMIN']);
export const authMethodEnum = pgEnum('AuthMethod', ['EMAIL_PASSWORD', 'OAUTH2_ONLY', 'HYBRID']);
export const adminLevelEnum = pgEnum('AdminLevel', ['JUNIOR', 'SENIOR', 'MANAGER', 'DIRECTOR', 'SUPER']);
export const accountRoleEnum = pgEnum('AccountRole', ['SHOP', 'USER']);
export const cartStateEnum = pgEnum('CartState', ['ACTIVE', 'COMPLETE', 'FAIL', 'PENDING']);
export const roleShopEnum = pgEnum('RoleShop', ['SHOP', 'WRITER', 'EDITOR', 'ADMIN']);
export const statusEnum = pgEnum('Status', ['ACTIVE', 'INACTIVE', 'PENDING']);
export const commentTypeEnum = pgEnum('CommentType', ['TEXT', 'HTML', 'MARKDOWN']);
export const commentTargetTypeEnum = pgEnum('CommentTargetType', [
  'PRODUCT',
  'ORDER',
  'REVIEW',
  'SHOP',
  'BLOG_POST',
  'ANNOUNCEMENT',
]);
export const commentAuthorTypeEnum = pgEnum('CommentAuthorType', ['USER', 'SHOP', 'ADMIN', 'SYSTEM']);
export const commentStatusEnum = pgEnum('CommentStatus', [
  'DRAFT',
  'PUBLISHED',
  'PENDING',
  'REJECTED',
  'HIDDEN',
  'SPAM',
]);
export const discountAppliesToEnum = pgEnum('DiscountAppliesTo', ['all', 'specific']);
export const orderStatusEnum = pgEnum('OrderStatus', ['PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'DELIVERED']);
export const notificationTypeEnum = pgEnum('NotificationType', ['PRODUCT', 'DISCOUNT']);
export const sexEnum = pgEnum('Sex', ['MALE', 'FEMALE']);
export const messageTypeEnum = pgEnum('MessageType', ['USER_TO_SHOP', 'SHOP_TO_USER']);
export const userSocialProviderEnum = pgEnum('UserSocialProvider', ['GOOGLE', 'FACEBOOK']);

export const accounts = pgTable('accounts', {
  id: textId(),
  accountType: accountTypeEnum('account_type').notNull(),
  status: statusEnum('status').notNull().default('ACTIVE'),
  isActive: isActive(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const accountAuthentication = pgTable(
  'account_authentication',
  {
    accountId: text('accountId')
      .primaryKey()
      .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    username: text('username'),
    email: text('email').notNull(),
    passwordHash: text('password_hash'),
    passwordSalt: text('password_salt'),
    authMethod: authMethodEnum('auth_method').notNull().default('EMAIL_PASSWORD'),
    isVerified: boolean('is_verified').notNull().default(false),
    lastLoginAt: bigint('last_login_at', { mode: 'bigint' }),
    loginCount: integer('login_count').notNull().default(0),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('account_authentication_username_key').on(table.username),
    uniqueIndex('account_authentication_email_key').on(table.email),
  ],
);

export const socialAuthentication = pgTable(
  'social_authentication',
  {
    id: textId(),
    authId: text('auth_id')
      .notNull()
      .references(() => accountAuthentication.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
    provider: text('provider').notNull(),
    providerId: text('provider_id').notNull(),
    providerEmail: text('provider_email'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: bigint('expires_at', { mode: 'bigint' }),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('social_authentication_auth_id_provider_key').on(table.authId, table.provider),
    uniqueIndex('social_authentication_provider_provider_id_key').on(table.provider, table.providerId),
  ],
);

export const accountSecurity = pgTable('account_security', {
  accountId: text('accountId')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  roles: text('roles').array().$type<string[]>(),
  permissions: text('permissions').array().$type<string[]>(),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorSecret: text('two_factor_secret'),
  backupCodes: text('backup_codes').array().$type<string[]>(),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: bigint('locked_until', { mode: 'bigint' }),
  suspiciousActivity: boolean('suspicious_activity').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const deviceSessions = pgTable(
  'DeviceSession',
  {
    id: textId(),
    accountId: text('accountId')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    deviceId: text('deviceId').notNull(),
    deviceName: text('deviceName'),
    lastLogin: timestamp('lastLogin', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('DeviceSession_deviceId_key').on(table.deviceId)],
);

export const userBehavior = pgTable('user_behavior', {
  accountId: text('accountId')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  membershipTier: text('membership_tier').default('bronze'),
  sex: sexEnum('sex').notNull().default('FEMALE'),
  preferences: jsonb('preferences').$type<Record<string, unknown>>(),
  dateOfBirth: timestamp('date_of_birth', { precision: 3, mode: 'date' }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const shopBusiness = pgTable('shop_business', {
  accountId: text('accountId')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  businessName: text('business_name').notNull(),
  businessType: text('business_type').notNull(),
  taxId: text('tax_id'),
  businessAddress: text('business_address'),
  totalSales: numeric('total_sales', { precision: 65, scale: 30, mode: 'number' }).notNull().default(0),
  totalOrders: integer('total_orders').notNull().default(0),
  rating: doublePrecision('rating').default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const adminAccess = pgTable('admin_access', {
  accountId: text('accountId')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  department: text('department').notNull(),
  position: text('position').notNull(),
  adminLevel: adminLevelEnum('admin_level').notNull(),
  supervisor: text('supervisor'),
  modules: text('modules').array().$type<string[]>(),
  territories: text('territories').array().$type<string[]>(),
  lastActivity: bigint('last_activity', { mode: 'bigint' }),
  actionsToday: integer('actions_today').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const accountProfiles = pgTable(
  'account_profiles',
  {
    accountId: text('accountId')
      .primaryKey()
      .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    avatar: text('avatar'),
    phone: text('phone'),
    address: text('address'),
    timezone: text('timezone'),
    language: text('language').default('en'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('account_profiles_phone_key').on(table.phone)],
);

export const accountPreferences = pgTable('account_preferences', {
  accountId: text('accountId')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  smsNotifications: boolean('sms_notifications').notNull().default(false),
  pushNotifications: boolean('push_notifications').notNull().default(true),
  profileVisibility: text('profile_visibility').notNull().default('public'),
  dataSharing: boolean('data_sharing').notNull().default(false),
  theme: text('theme').notNull().default('light'),
  language: text('language').notNull().default('en'),
  currency: text('currency').notNull().default('USD'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const keyTokens = pgTable(
  'key_tokens',
  {
    id: textId(),
    authId: text('auth_id')
      .notNull()
      .references(() => accountAuthentication.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
    deviceId: text('device_id').notNull(),
    publicKey: text('public_key').notNull(),
    refreshToken: text('refresh_token').notNull(),
    expiresAt: bigint('expires_at', { mode: 'bigint' }),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('key_tokens_auth_id_device_id_key').on(table.authId, table.deviceId)],
);

export const refreshTokensUsed = pgTable(
  'refresh_tokens_used',
  {
    id: textId(),
    keyTokenId: text('key_token_id')
      .notNull()
      .references(() => keyTokens.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    token: text('refresh_token').notNull(),
    usedAt: timestamp('used_at', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    reason: text('reason'),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    deviceInfo: text('device_info'),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('refresh_tokens_used_refresh_token_idx').on(table.token),
    index('refresh_tokens_used_key_token_id_idx').on(table.keyTokenId),
  ],
);

export const passwordResets = pgTable(
  'password_resets',
  {
    id: textId(),
    authId: text('auth_id')
      .notNull()
      .references(() => accountAuthentication.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
    token: text('token').notNull(),
    tokenHash: text('token_hash').notNull(),
    requestedAt: timestamp('requested_at', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    isUsed: boolean('is_used').notNull().default(false),
    usedAt: timestamp('used_at', { precision: 3, mode: 'date' }),
    usedIpAddress: text('used_ip_address'),
    usedUserAgent: text('used_user_agent'),
    attemptCount: integer('attempt_count').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    isBlocked: boolean('is_blocked').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('password_resets_token_key').on(table.token),
    index('password_resets_token_idx').on(table.token),
    index('password_resets_auth_id_idx').on(table.authId),
    index('password_resets_expires_at_idx').on(table.expiresAt),
  ],
);

export const adminActivityLogs = pgTable('admin_activity_logs', {
  id: textId(),
  adminId: text('admin_id')
    .notNull()
    .references(() => adminAccess.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  createdAt: createdAt(),
});

export const brand = pgTable(
  'Brand',
  {
    id: textId(),
    name: varchar('name', { length: 100 }).notNull(),
    image: varchar('image', { length: 1000 }).notNull().default(''),
    initial: varchar('initial', { length: 1 }).notNull().default(''),
    sort: integer('sort').default(10),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('Brand_name_key').on(table.name)],
);

export const category = pgTable('Category', {
  id: textId(),
  name: varchar('name', { length: 50 }),
  sort: integer('sort'),
  isActive: isActive(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const spu = pgTable(
  'Spu',
  {
    id: textId(),
    name: varchar('name', { length: 100 }).notNull(),
    intro: varchar('intro', { length: 200 }),
    brandId: text('brandId')
      .notNull()
      .references(() => brand.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    categoryId: text('categoryId')
      .notNull()
      .references(() => category.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    images: varchar('images', { length: 1000 }).array().notNull(),
    afterSalesService: varchar('afterSalesService', { length: 50 }),
    content: text('content'),
    attributeList: varchar('attributeList', { length: 3000 }),
    isMarketable: boolean('isMarketable').notNull().default(false),
    status: integer('status').notNull().default(0),
    shopBusinessId: text('shopBusinessId')
      .notNull()
      .references(() => shopBusiness.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('Spu_name_key').on(table.name),
    uniqueIndex('Spu_name_brandId_key').on(table.name, table.brandId),
  ],
);

export const sku = pgTable(
  'Sku',
  {
    id: textId(),
    name: varchar('name', { length: 200 }).notNull(),
    price: integer('price').notNull().default(1),
    num: integer('num').default(100),
    image: varchar('image', { length: 200 }),
    images: varchar('images', { length: 2000 }).array().notNull(),
    spuId: varchar('spuId', { length: 60 })
      .notNull()
      .references(() => spu.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    brandName: varchar('brandName', { length: 100 }),
    skuAttribute: varchar('skuAttribute', { length: 200 }),
    status: integer('status').default(1),
    inventoryId: text('inventory_id'),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('Sku_status_idx').on(table.status), index('updated').on(table.updatedAt)],
);

export const inventories = pgTable(
  'inventories',
  {
    id: textId(),
    inventoryLocation: text('inventory_location').notNull().default('unKnow'),
    inventoryStock: integer('inventory_stock').notNull(),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    inventoryProductId: text('inventory_product_id')
      .notNull()
      .references(() => sku.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    shopBusinessId: text('shopBusinessId')
      .notNull()
      .references(() => shopBusiness.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [uniqueIndex('inventories_inventory_product_id_key').on(table.inventoryProductId)],
);

export const reservationInventories = pgTable(
  'reservation_inventories',
  {
    id: textId(),
    inventoryId: text('inventory_id')
      .notNull()
      .references(() => inventories.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    userId: text('user_id').notNull(),
    quantity: integer('quantity').notNull(),
    expiredAt: timestamp('expired_at', { precision: 3, mode: 'date' }).notNull(),
    isConfirmed: boolean('isConfirmed').notNull().default(false),
    valid: boolean('valid').notNull().default(true),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('reservation_inventories_inventory_id_user_id_key').on(table.inventoryId, table.userId)],
);

export const discounts = pgTable(
  'discounts',
  {
    id: textId(),
    discountName: text('discount_name').notNull(),
    discountDescription: text('discount_description').notNull(),
    discountType: text('discount_type').notNull().default('fixed_amount'),
    discountValue: doublePrecision('discount_value').notNull(),
    discountCode: text('discount_code').notNull(),
    discountStartDates: timestamp('discount_start_dates', { precision: 3, mode: 'date' }).notNull(),
    discountEndDates: timestamp('discount_end_dates', { precision: 3, mode: 'date' }).notNull(),
    discountMaxUses: integer('discount_max_uses').notNull(),
    discountUsesCount: integer('discount_uses_count').notNull(),
    discountUsersUsed: text('discount_users_used').array().notNull().default(sql`ARRAY[]::TEXT[]`),
    discountMaxUsesPerUser: integer('discount_max_uses_per_user').notNull(),
    discountMinOrderValue: doublePrecision('discount_min_order_value').notNull(),
    discountShopId: text('discount_shop')
      .notNull()
      .references(() => shopBusiness.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
    discountIsActive: boolean('discount_is_active').notNull().default(true),
    discountAppliesTo: discountAppliesToEnum('discount_applies_to').notNull(),
    discountProductIds: text('discount_product_ids').array().notNull().default(sql`ARRAY[]::TEXT[]`),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('discounts_discount_code_key').on(table.discountCode)],
);

export const carts = pgTable(
  'carts',
  {
    id: textId(),
    state: cartStateEnum('cart_state').notNull().default('ACTIVE'),
    countProduct: integer('cart_count_product').notNull().default(0),
    userId: text('cart_userId')
      .notNull()
      .references(() => userBehavior.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('carts_cart_userId_key').on(table.userId)],
);

export const cartProducts = pgTable(
  'cart_products',
  {
    id: textId(),
    productId: text('cart_product_productId').notNull(),
    shopId: text('cart_product_shopId').notNull(),
    quantity: integer('cart_product_quantity').notNull(),
    name: text('cart_product_name').notNull(),
    price: doublePrecision('cart_product_price').notNull(),
    cartId: text('cart_product_cartId')
      .notNull()
      .references(() => carts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('cart_products_cart_product_cartId_cart_product_productId_key').on(table.cartId, table.productId)],
);

export const orders = pgTable('orders', {
  id: textId(),
  userId: text('user_id')
    .notNull()
    .references(() => userBehavior.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
  status: orderStatusEnum('status').notNull(),
  totalDiscount: numeric('total_discount ', { precision: 65, scale: 30, mode: 'number' }).notNull(),
  shippingFee: numeric('shipping_fee', { precision: 65, scale: 30, mode: 'number' }).notNull(),
  shippingAddress: text('shipping_street').notNull(),
  totalPrice: numeric('total_price', { precision: 65, scale: 30, mode: 'number' }).notNull(),
  paymentInfo: jsonb('payment_info').notNull().$type<Record<string, unknown>>(),
  paymentIntentId: text('payment_intent_id'),
  expiredAt: timestamp('expired_at', { precision: 3, mode: 'date' }).notNull(),
  isActive: isActive(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  shopBusinessId: text('shopBusinessId')
    .notNull()
    .references(() => shopBusiness.accountId, { onDelete: 'restrict', onUpdate: 'cascade' }),
});

export const orderItems = pgTable('order_items', {
  id: textId(),
  orderId: text('orderId')
    .notNull()
    .references(() => orders.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  inventoryId: text('inventoryId')
    .notNull()
    .references(() => inventories.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
  isActive: isActive(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const comments = pgTable('comments', {
  id: textId(),
  content: text('content').notNull(),
  contentType: commentTypeEnum('content_type').notNull().default('TEXT'),
  targetType: commentTargetTypeEnum('target_type').notNull(),
  targetId: text('target_id').notNull(),
  authorId: text('author_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  authorType: commentAuthorTypeEnum('author_type').notNull().default('USER'),
  threadId: text('thread_id'),
  status: commentStatusEnum('status').notNull().default('PUBLISHED'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  isPinned: boolean('is_pinned').notNull().default(false),
  isEdited: boolean('is_edited').notNull().default(false),
  editedAt: bigint('edited_at', { mode: 'bigint' }),
  likesCount: integer('likes_count').notNull().default(0),
  dislikesCount: integer('dislikes_count').notNull().default(0),
  repliesCount: integer('replies_count').notNull().default(0),
  ipAddress: text('ip_address').default('127.0.0.1'),
  userAgent: text('user_agent'),
  isActive: isActive(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  spuId: text('spu_id')
    .notNull()
    .references(() => spu.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
});

export const commentClosureTable = pgTable(
  'comment_closure',
  {
    ancestorId: text('ancestorId')
      .notNull()
      .references(() => comments.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    descendantId: text('descendantId')
      .notNull()
      .references(() => comments.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    depth: integer('depth').notNull(),
  },
  (table) => [primaryKey({ columns: [table.ancestorId, table.descendantId] })],
);

export const notificationThreads = pgTable(
  'notification_threads',
  {
    id: textId(),
    accountId: text('noti_thread_user_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('notification_threads_noti_thread_user_id_key').on(table.accountId)],
);

export const notifications = pgTable('notifications', {
  id: textId(),
  type: notificationTypeEnum('noti_type').notNull(),
  senderId: text('noti_sender_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  threadId: text('noti_thread_id')
    .notNull()
    .references(() => notificationThreads.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  content: text('noti_content').notNull(),
  option: jsonb('noti_option').notNull().$type<Record<string, unknown>>(),
  status: text('notification_status').notNull().default('unread'),
  productId: text('noti_product_id'),
  discountId: text('noti_discount_id'),
  isActive: isActive(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const categoryClosureTable = pgTable(
  'CategoryClosureTable',
  {
    ancestorId: text('ancestorId')
      .notNull()
      .references(() => category.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    descendantId: text('descendantId')
      .notNull()
      .references(() => category.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    depth: integer('depth').notNull(),
    isActive: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [primaryKey({ columns: [table.ancestorId, table.descendantId] })],
);

export const categoryBrand = pgTable(
  'CategoryBrand',
  {
    categoryId: text('categoryId')
      .notNull()
      .references(() => category.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    brandId: text('brandId')
      .notNull()
      .references(() => brand.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.brandId, table.categoryId] })],
);

export const categoryAttr = pgTable(
  'CategoryAttr',
  {
    categoryId: text('categoryId')
      .notNull()
      .references(() => category.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    attrId: text('attrId')
      .notNull()
      .references(() => skuAttribute.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.categoryId, table.attrId] })],
);

export const skuAttribute = pgTable('SkuAttribute', {
  id: textId(),
  name: varchar('name', { length: 50 }),
  options: varchar('options', { length: 2000 }),
  sort: integer('sort'),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  authentication: one(accountAuthentication, {
    fields: [accounts.id],
    references: [accountAuthentication.accountId],
  }),
  profile: one(accountProfiles, {
    fields: [accounts.id],
    references: [accountProfiles.accountId],
  }),
  preferences: one(accountPreferences, {
    fields: [accounts.id],
    references: [accountPreferences.accountId],
  }),
  security: one(accountSecurity, {
    fields: [accounts.id],
    references: [accountSecurity.accountId],
  }),
  deviceSession: many(deviceSessions),
  userBehavior: one(userBehavior, {
    fields: [accounts.id],
    references: [userBehavior.accountId],
  }),
  shopBusiness: one(shopBusiness, {
    fields: [accounts.id],
    references: [shopBusiness.accountId],
  }),
  adminAccess: one(adminAccess, {
    fields: [accounts.id],
    references: [adminAccess.accountId],
  }),
  comments: many(comments),
  notificationThread: one(notificationThreads, {
    fields: [accounts.id],
    references: [notificationThreads.accountId],
  }),
  notification: many(notifications),
}));

export const accountAuthenticationRelations = relations(accountAuthentication, ({ one, many }) => ({
  account: one(accounts, {
    fields: [accountAuthentication.accountId],
    references: [accounts.id],
  }),
  socialAuth: many(socialAuthentication),
  keyTokens: many(keyTokens),
  passwordResets: many(passwordResets),
}));

export const socialAuthenticationRelations = relations(socialAuthentication, ({ one }) => ({
  authentication: one(accountAuthentication, {
    fields: [socialAuthentication.authId],
    references: [accountAuthentication.accountId],
  }),
}));

export const accountSecurityRelations = relations(accountSecurity, ({ one }) => ({
  account: one(accounts, {
    fields: [accountSecurity.accountId],
    references: [accounts.id],
  }),
}));

export const deviceSessionsRelations = relations(deviceSessions, ({ one }) => ({
  account: one(accounts, {
    fields: [deviceSessions.accountId],
    references: [accounts.id],
  }),
}));

export const userBehaviorRelations = relations(userBehavior, ({ one, many }) => ({
  account: one(accounts, {
    fields: [userBehavior.accountId],
    references: [accounts.id],
  }),
  cart: one(carts, {
    fields: [userBehavior.accountId],
    references: [carts.userId],
  }),
  orders: many(orders),
}));

export const shopBusinessRelations = relations(shopBusiness, ({ one, many }) => ({
  account: one(accounts, {
    fields: [shopBusiness.accountId],
    references: [accounts.id],
  }),
  spu: many(spu),
  orders: many(orders),
  inventory: many(inventories),
  discount: many(discounts),
}));

export const accountProfilesRelations = relations(accountProfiles, ({ one }) => ({
  account: one(accounts, {
    fields: [accountProfiles.accountId],
    references: [accounts.id],
  }),
}));

export const accountPreferencesRelations = relations(accountPreferences, ({ one }) => ({
  account: one(accounts, {
    fields: [accountPreferences.accountId],
    references: [accounts.id],
  }),
}));

export const keyTokensRelations = relations(keyTokens, ({ one, many }) => ({
  authentication: one(accountAuthentication, {
    fields: [keyTokens.authId],
    references: [accountAuthentication.accountId],
  }),
  usedTokens: many(refreshTokensUsed),
}));

export const refreshTokensUsedRelations = relations(refreshTokensUsed, ({ one }) => ({
  keyToken: one(keyTokens, {
    fields: [refreshTokensUsed.keyTokenId],
    references: [keyTokens.id],
  }),
}));

export const inventoriesRelations = relations(inventories, ({ one, many }) => ({
  inventoryProduct: one(sku, {
    fields: [inventories.inventoryProductId],
    references: [sku.id],
  }),
  shopBusiness: one(shopBusiness, {
    fields: [inventories.shopBusinessId],
    references: [shopBusiness.accountId],
  }),
  reservations: many(reservationInventories),
  orderItem: many(orderItems),
}));

export const discountsRelations = relations(discounts, ({ one }) => ({
  discountShop: one(shopBusiness, {
    fields: [discounts.discountShopId],
    references: [shopBusiness.accountId],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(userBehavior, {
    fields: [carts.userId],
    references: [userBehavior.accountId],
  }),
  cartProducts: many(cartProducts),
}));

export const cartProductsRelations = relations(cartProducts, ({ one }) => ({
  cart: one(carts, {
    fields: [cartProducts.cartId],
    references: [carts.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  orderItems: many(orderItems),
  user: one(userBehavior, {
    fields: [orders.userId],
    references: [userBehavior.accountId],
  }),
  shopBusiness: one(shopBusiness, {
    fields: [orders.shopBusinessId],
    references: [shopBusiness.accountId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  inventory: one(inventories, {
    fields: [orderItems.inventoryId],
    references: [inventories.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  ancestors: many(commentClosureTable, { relationName: 'CommentDescendant' }),
  descendants: many(commentClosureTable, { relationName: 'CommentAncestor' }),
  author: one(accounts, {
    fields: [comments.authorId],
    references: [accounts.id],
  }),
  spu: one(spu, {
    fields: [comments.spuId],
    references: [spu.id],
  }),
}));

export const commentClosureTableRelations = relations(commentClosureTable, ({ one }) => ({
  ancestor: one(comments, {
    fields: [commentClosureTable.ancestorId],
    references: [comments.id],
    relationName: 'CommentAncestor',
  }),
  descendants: one(comments, {
    fields: [commentClosureTable.descendantId],
    references: [comments.id],
    relationName: 'CommentDescendant',
  }),
}));

export const notificationThreadsRelations = relations(notificationThreads, ({ one, many }) => ({
  account: one(accounts, {
    fields: [notificationThreads.accountId],
    references: [accounts.id],
  }),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  sender: one(accounts, {
    fields: [notifications.senderId],
    references: [accounts.id],
  }),
  thread: one(notificationThreads, {
    fields: [notifications.threadId],
    references: [notificationThreads.id],
  }),
}));

export const spuRelations = relations(spu, ({ one, many }) => ({
  brand: one(brand, {
    fields: [spu.brandId],
    references: [brand.id],
  }),
  category: one(category, {
    fields: [spu.categoryId],
    references: [category.id],
  }),
  skus: many(sku),
  comment: many(comments),
  shopBusiness: one(shopBusiness, {
    fields: [spu.shopBusinessId],
    references: [shopBusiness.accountId],
  }),
}));

export const skuRelations = relations(sku, ({ one }) => ({
  spu: one(spu, {
    fields: [sku.spuId],
    references: [spu.id],
  }),
  inventory: one(inventories, {
    fields: [sku.id],
    references: [inventories.inventoryProductId],
  }),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  ancestors: many(categoryClosureTable, { relationName: 'ancestor' }),
  descendants: many(categoryClosureTable, { relationName: 'descendant' }),
  spu: many(spu),
  brands: many(categoryBrand),
  attrs: many(categoryAttr),
}));

export const brandRelations = relations(brand, ({ many }) => ({
  spu: many(spu),
  categories: many(categoryBrand),
}));
