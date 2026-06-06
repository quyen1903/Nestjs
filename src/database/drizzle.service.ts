import { randomUUID } from 'node:crypto';
import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  and,
  asc,
  count as drizzleCount,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  not,
  notExists,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

type ModelName =
  | 'account'
  | 'accountAuthentication'
  | 'socialAuthentication'
  | 'accountSecurity'
  | 'deviceSession'
  | 'userBehavior'
  | 'shopBusiness'
  | 'adminAccess'
  | 'accountProfile'
  | 'accountPreferences'
  | 'keyToken'
  | 'refreshTokenUsed'
  | 'passwordReset'
  | 'adminActivityLog'
  | 'inventory'
  | 'reservationInventory'
  | 'discount'
  | 'cart'
  | 'cartProduct'
  | 'order'
  | 'orderItem'
  | 'commentClosureTable'
  | 'comment'
  | 'notificationThread'
  | 'notification'
  | 'spu'
  | 'sku'
  | 'category'
  | 'categoryClosureTable'
  | 'brand'
  | 'categoryBrand'
  | 'categoryAttr'
  | 'skuAttribute';

type DatabaseExecutor = any;

type RelationConfig = {
  model: ModelName;
  type: 'one' | 'many';
  localField: string;
  foreignField: string;
};

type ModelConfig = {
  name: ModelName;
  table: any;
  columns: Record<string, any>;
  primaryKey?: string;
  softDelete?: boolean;
  timestamps?: boolean;
  bigintFields?: string[];
  dateFields?: string[];
  uniqueKeys?: Record<string, string[]>;
  relations?: Record<string, RelationConfig>;
};

type QueryArgs = {
  where?: Record<string, any>;
  data?: any;
  include?: Record<string, any>;
  select?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[];
  skip?: number;
  take?: number;
};

const BIGINT_TIMESTAMP_FIELDS = ['createdAt', 'updatedAt'];
const ID_MODELS = new Set<ModelName>([
  'account',
  'socialAuthentication',
  'deviceSession',
  'keyToken',
  'refreshTokenUsed',
  'passwordReset',
  'adminActivityLog',
  'inventory',
  'reservationInventory',
  'discount',
  'cart',
  'cartProduct',
  'order',
  'orderItem',
  'comment',
  'notificationThread',
  'notification',
  'spu',
  'sku',
  'category',
  'brand',
  'skuAttribute',
]);

const modelConfigs: Record<ModelName, ModelConfig> = {
  account: {
    name: 'account',
    table: schema.accounts,
    columns: schema.accounts,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      authentication: { model: 'accountAuthentication', type: 'one', localField: 'id', foreignField: 'accountId' },
      profile: { model: 'accountProfile', type: 'one', localField: 'id', foreignField: 'accountId' },
      preferences: { model: 'accountPreferences', type: 'one', localField: 'id', foreignField: 'accountId' },
      security: { model: 'accountSecurity', type: 'one', localField: 'id', foreignField: 'accountId' },
      deviceSession: { model: 'deviceSession', type: 'many', localField: 'id', foreignField: 'accountId' },
      userBehavior: { model: 'userBehavior', type: 'one', localField: 'id', foreignField: 'accountId' },
      shopBusiness: { model: 'shopBusiness', type: 'one', localField: 'id', foreignField: 'accountId' },
      adminAccess: { model: 'adminAccess', type: 'one', localField: 'id', foreignField: 'accountId' },
      comments: { model: 'comment', type: 'many', localField: 'id', foreignField: 'authorId' },
      notificationThread: { model: 'notificationThread', type: 'one', localField: 'id', foreignField: 'accountId' },
      notification: { model: 'notification', type: 'many', localField: 'id', foreignField: 'senderId' },
    },
  },
  accountAuthentication: {
    name: 'accountAuthentication',
    table: schema.accountAuthentication,
    columns: schema.accountAuthentication,
    primaryKey: 'accountId',
    softDelete: true,
    timestamps: true,
    bigintFields: ['lastLoginAt'],
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
      socialAuth: { model: 'socialAuthentication', type: 'many', localField: 'accountId', foreignField: 'authId' },
      keyTokens: { model: 'keyToken', type: 'many', localField: 'accountId', foreignField: 'authId' },
      passwordResets: { model: 'passwordReset', type: 'many', localField: 'accountId', foreignField: 'authId' },
    },
  },
  socialAuthentication: {
    name: 'socialAuthentication',
    table: schema.socialAuthentication,
    columns: schema.socialAuthentication,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    bigintFields: ['expiresAt'],
    uniqueKeys: {
      authId_provider: ['authId', 'provider'],
      provider_providerId: ['provider', 'providerId'],
    },
    relations: {
      authentication: { model: 'accountAuthentication', type: 'one', localField: 'authId', foreignField: 'accountId' },
    },
  },
  accountSecurity: {
    name: 'accountSecurity',
    table: schema.accountSecurity,
    columns: schema.accountSecurity,
    primaryKey: 'accountId',
    timestamps: true,
    bigintFields: ['lockedUntil'],
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
    },
  },
  deviceSession: {
    name: 'deviceSession',
    table: schema.deviceSessions,
    columns: schema.deviceSessions,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    dateFields: ['lastLogin'],
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
    },
  },
  userBehavior: {
    name: 'userBehavior',
    table: schema.userBehavior,
    columns: schema.userBehavior,
    primaryKey: 'accountId',
    timestamps: true,
    dateFields: ['dateOfBirth'],
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
      cart: { model: 'cart', type: 'one', localField: 'accountId', foreignField: 'userId' },
      orders: { model: 'order', type: 'many', localField: 'accountId', foreignField: 'userId' },
    },
  },
  shopBusiness: {
    name: 'shopBusiness',
    table: schema.shopBusiness,
    columns: schema.shopBusiness,
    primaryKey: 'accountId',
    timestamps: true,
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
      spu: { model: 'spu', type: 'many', localField: 'accountId', foreignField: 'shopBusinessId' },
      orders: { model: 'order', type: 'many', localField: 'accountId', foreignField: 'shopBusinessId' },
      inventory: { model: 'inventory', type: 'many', localField: 'accountId', foreignField: 'shopBusinessId' },
      discount: { model: 'discount', type: 'many', localField: 'accountId', foreignField: 'discountShopId' },
    },
  },
  adminAccess: {
    name: 'adminAccess',
    table: schema.adminAccess,
    columns: schema.adminAccess,
    primaryKey: 'accountId',
    timestamps: true,
    bigintFields: ['lastActivity'],
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
      adminLogs: { model: 'adminActivityLog', type: 'many', localField: 'accountId', foreignField: 'adminId' },
    },
  },
  accountProfile: {
    name: 'accountProfile',
    table: schema.accountProfiles,
    columns: schema.accountProfiles,
    primaryKey: 'accountId',
    timestamps: true,
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
    },
  },
  accountPreferences: {
    name: 'accountPreferences',
    table: schema.accountPreferences,
    columns: schema.accountPreferences,
    primaryKey: 'accountId',
    timestamps: true,
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
    },
  },
  keyToken: {
    name: 'keyToken',
    table: schema.keyTokens,
    columns: schema.keyTokens,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    bigintFields: ['expiresAt'],
    uniqueKeys: {
      authId_deviceId: ['authId', 'deviceId'],
    },
    relations: {
      authentication: { model: 'accountAuthentication', type: 'one', localField: 'authId', foreignField: 'accountId' },
      usedTokens: { model: 'refreshTokenUsed', type: 'many', localField: 'id', foreignField: 'keyTokenId' },
    },
  },
  refreshTokenUsed: {
    name: 'refreshTokenUsed',
    table: schema.refreshTokensUsed,
    columns: schema.refreshTokensUsed,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    dateFields: ['usedAt'],
    relations: {
      keyToken: { model: 'keyToken', type: 'one', localField: 'keyTokenId', foreignField: 'id' },
    },
  },
  passwordReset: {
    name: 'passwordReset',
    table: schema.passwordResets,
    columns: schema.passwordResets,
    primaryKey: 'id',
    timestamps: true,
    dateFields: ['requestedAt', 'expiresAt', 'usedAt'],
    relations: {
      authentication: { model: 'accountAuthentication', type: 'one', localField: 'authId', foreignField: 'accountId' },
    },
  },
  adminActivityLog: {
    name: 'adminActivityLog',
    table: schema.adminActivityLogs,
    columns: schema.adminActivityLogs,
    primaryKey: 'id',
    timestamps: true,
    relations: {
      admin: { model: 'adminAccess', type: 'one', localField: 'adminId', foreignField: 'accountId' },
    },
  },
  inventory: {
    name: 'inventory',
    table: schema.inventories,
    columns: schema.inventories,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      inventoryProduct: { model: 'sku', type: 'one', localField: 'inventoryProductId', foreignField: 'id' },
      reservations: { model: 'reservationInventory', type: 'many', localField: 'id', foreignField: 'inventoryId' },
      orderItem: { model: 'orderItem', type: 'many', localField: 'id', foreignField: 'inventoryId' },
      shopBusiness: { model: 'shopBusiness', type: 'one', localField: 'shopBusinessId', foreignField: 'accountId' },
    },
  },
  reservationInventory: {
    name: 'reservationInventory',
    table: schema.reservationInventories,
    columns: schema.reservationInventories,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    dateFields: ['expiredAt'],
    uniqueKeys: {
      inventoryId_userId: ['inventoryId', 'userId'],
    },
    relations: {
      inventory: { model: 'inventory', type: 'one', localField: 'inventoryId', foreignField: 'id' },
    },
  },
  discount: {
    name: 'discount',
    table: schema.discounts,
    columns: schema.discounts,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    dateFields: ['discountStartDates', 'discountEndDates'],
    relations: {
      discountShop: { model: 'shopBusiness', type: 'one', localField: 'discountShopId', foreignField: 'accountId' },
    },
  },
  cart: {
    name: 'cart',
    table: schema.carts,
    columns: schema.carts,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      cartProducts: { model: 'cartProduct', type: 'many', localField: 'id', foreignField: 'cartId' },
      user: { model: 'userBehavior', type: 'one', localField: 'userId', foreignField: 'accountId' },
    },
  },
  cartProduct: {
    name: 'cartProduct',
    table: schema.cartProducts,
    columns: schema.cartProducts,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    uniqueKeys: {
      cartId_productId: ['cartId', 'productId'],
    },
    relations: {
      cart: { model: 'cart', type: 'one', localField: 'cartId', foreignField: 'id' },
    },
  },
  order: {
    name: 'order',
    table: schema.orders,
    columns: schema.orders,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    dateFields: ['expiredAt'],
    relations: {
      orderItems: { model: 'orderItem', type: 'many', localField: 'id', foreignField: 'orderId' },
      user: { model: 'userBehavior', type: 'one', localField: 'userId', foreignField: 'accountId' },
      shopBusiness: { model: 'shopBusiness', type: 'one', localField: 'shopBusinessId', foreignField: 'accountId' },
    },
  },
  orderItem: {
    name: 'orderItem',
    table: schema.orderItems,
    columns: schema.orderItems,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      order: { model: 'order', type: 'one', localField: 'orderId', foreignField: 'id' },
      inventory: { model: 'inventory', type: 'one', localField: 'inventoryId', foreignField: 'id' },
    },
  },
  commentClosureTable: {
    name: 'commentClosureTable',
    table: schema.commentClosureTable,
    columns: schema.commentClosureTable,
    primaryKey: 'ancestorId',
    relations: {
      ancestor: { model: 'comment', type: 'one', localField: 'ancestorId', foreignField: 'id' },
      descendants: { model: 'comment', type: 'one', localField: 'descendantId', foreignField: 'id' },
    },
  },
  comment: {
    name: 'comment',
    table: schema.comments,
    columns: schema.comments,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    bigintFields: ['editedAt'],
    relations: {
      ancestors: { model: 'commentClosureTable', type: 'many', localField: 'id', foreignField: 'descendantId' },
      descendants: { model: 'commentClosureTable', type: 'many', localField: 'id', foreignField: 'ancestorId' },
      author: { model: 'account', type: 'one', localField: 'authorId', foreignField: 'id' },
      spu: { model: 'spu', type: 'one', localField: 'spuId', foreignField: 'id' },
    },
  },
  notificationThread: {
    name: 'notificationThread',
    table: schema.notificationThreads,
    columns: schema.notificationThreads,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      account: { model: 'account', type: 'one', localField: 'accountId', foreignField: 'id' },
      notifications: { model: 'notification', type: 'many', localField: 'id', foreignField: 'threadId' },
    },
  },
  notification: {
    name: 'notification',
    table: schema.notifications,
    columns: schema.notifications,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      sender: { model: 'account', type: 'one', localField: 'senderId', foreignField: 'id' },
      thread: { model: 'notificationThread', type: 'one', localField: 'threadId', foreignField: 'id' },
    },
  },
  spu: {
    name: 'spu',
    table: schema.spu,
    columns: schema.spu,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      brand: { model: 'brand', type: 'one', localField: 'brandId', foreignField: 'id' },
      category: { model: 'category', type: 'one', localField: 'categoryId', foreignField: 'id' },
      skus: { model: 'sku', type: 'many', localField: 'id', foreignField: 'spuId' },
      comment: { model: 'comment', type: 'many', localField: 'id', foreignField: 'spuId' },
      shopBusiness: { model: 'shopBusiness', type: 'one', localField: 'shopBusinessId', foreignField: 'accountId' },
    },
  },
  sku: {
    name: 'sku',
    table: schema.sku,
    columns: schema.sku,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      spu: { model: 'spu', type: 'one', localField: 'spuId', foreignField: 'id' },
      inventory: { model: 'inventory', type: 'one', localField: 'id', foreignField: 'inventoryProductId' },
    },
  },
  category: {
    name: 'category',
    table: schema.category,
    columns: schema.category,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      ancestors: { model: 'categoryClosureTable', type: 'many', localField: 'id', foreignField: 'descendantId' },
      descendants: { model: 'categoryClosureTable', type: 'many', localField: 'id', foreignField: 'ancestorId' },
      spu: { model: 'spu', type: 'many', localField: 'id', foreignField: 'categoryId' },
      brands: { model: 'categoryBrand', type: 'many', localField: 'id', foreignField: 'categoryId' },
      attrs: { model: 'categoryAttr', type: 'many', localField: 'id', foreignField: 'categoryId' },
    },
  },
  categoryClosureTable: {
    name: 'categoryClosureTable',
    table: schema.categoryClosureTable,
    columns: schema.categoryClosureTable,
    primaryKey: 'ancestorId',
    softDelete: true,
    timestamps: true,
    relations: {
      ancestor: { model: 'category', type: 'one', localField: 'ancestorId', foreignField: 'id' },
      descendant: { model: 'category', type: 'one', localField: 'descendantId', foreignField: 'id' },
    },
  },
  brand: {
    name: 'brand',
    table: schema.brand,
    columns: schema.brand,
    primaryKey: 'id',
    softDelete: true,
    timestamps: true,
    relations: {
      spu: { model: 'spu', type: 'many', localField: 'id', foreignField: 'brandId' },
      categories: { model: 'categoryBrand', type: 'many', localField: 'id', foreignField: 'brandId' },
    },
  },
  categoryBrand: {
    name: 'categoryBrand',
    table: schema.categoryBrand,
    columns: schema.categoryBrand,
    primaryKey: 'brandId',
    relations: {
      category: { model: 'category', type: 'one', localField: 'categoryId', foreignField: 'id' },
      brand: { model: 'brand', type: 'one', localField: 'brandId', foreignField: 'id' },
    },
  },
  categoryAttr: {
    name: 'categoryAttr',
    table: schema.categoryAttr,
    columns: schema.categoryAttr,
    primaryKey: 'categoryId',
    relations: {
      category: { model: 'category', type: 'one', localField: 'categoryId', foreignField: 'id' },
      attribute: { model: 'skuAttribute', type: 'one', localField: 'attrId', foreignField: 'id' },
    },
  },
  skuAttribute: {
    name: 'skuAttribute',
    table: schema.skuAttribute,
    columns: schema.skuAttribute,
    primaryKey: 'id',
    relations: {
      categories: { model: 'categoryAttr', type: 'many', localField: 'id', foreignField: 'attrId' },
    },
  },
};

class DrizzleDelegate {
  constructor(
    private readonly service: DrizzleService,
    private readonly config: ModelConfig,
  ) {}

  findFirst(args: QueryArgs = {}): Promise<any> {
    return this.findMany({ ...args, take: 1 }).then((rows) => rows[0] ?? null);
  }

  findUnique(args: QueryArgs = {}): Promise<any> {
    return this.findFirst(args);
  }

  async findMany(args: QueryArgs = {}): Promise<any[]> {
    const whereCondition = this.service.buildWhere(this.config, args.where);
    let query = this.service.db.select().from(this.config.table).$dynamic();

    if (whereCondition) {
      query = query.where(whereCondition);
    }

    const orderBy = this.service.buildOrderBy(this.config, args.orderBy);
    if (orderBy.length > 0) {
      query = query.orderBy(...orderBy);
    }

    if (typeof args.take === 'number') {
      query = query.limit(args.take);
    }

    if (typeof args.skip === 'number') {
      query = query.offset(args.skip);
    }

    const rows = await query;
    return Promise.all(rows.map((row: Record<string, any>) => this.service.applySelection(this.config, row, args)));
  }

  async create(args: QueryArgs): Promise<any> {
    const data = this.service.normalizeCreateData(this.config, args.data);
    const [row] = await this.service.db.insert(this.config.table).values(data).returning();
    return this.service.applySelection(this.config, row, args);
  }

  async createMany(args: QueryArgs): Promise<{ count: number }> {
    const rows = Array.isArray(args.data) ? args.data : [];
    if (rows.length === 0) {
      return { count: 0 };
    }

    const values = rows.map((row) => this.service.normalizeCreateData(this.config, row));
    const created = await this.service.db.insert(this.config.table).values(values).returning();
    return { count: created.length };
  }

  async update(args: QueryArgs): Promise<any> {
    const whereCondition = this.service.buildWhere(this.config, args.where);
    const data = this.service.normalizeUpdateData(this.config, args.data);
    const [row] = await this.service.db.update(this.config.table).set(data).where(whereCondition).returning();
    return row ? this.service.applySelection(this.config, row, args) : null;
  }

  async updateMany(args: QueryArgs): Promise<{ count: number }> {
    const whereCondition = this.service.buildWhere(this.config, args.where);
    const data = this.service.normalizeUpdateData(this.config, args.data);
    const rows = await this.service.db.update(this.config.table).set(data).where(whereCondition).returning();
    return { count: rows.length };
  }

  async delete(args: QueryArgs): Promise<any> {
    if (this.config.softDelete) {
      return this.update({
        ...args,
        data: { isActive: false },
      });
    }

    const whereCondition = this.service.buildWhere(this.config, args.where, false);
    const [row] = await this.service.db.delete(this.config.table).where(whereCondition).returning();
    return row ?? null;
  }

  async deleteMany(args: QueryArgs): Promise<{ count: number }> {
    if (this.config.softDelete) {
      return this.updateMany({
        ...args,
        data: { isActive: false },
      });
    }

    const whereCondition = this.service.buildWhere(this.config, args.where, false);
    const rows = await this.service.db.delete(this.config.table).where(whereCondition).returning();
    return { count: rows.length };
  }

  async upsert(args: QueryArgs & { update: any; create: any }): Promise<any> {
    const existing = await this.findFirst({ where: args.where });

    if (existing) {
      return this.update({
        where: this.service.extractIdentityWhere(this.config, existing, args.where),
        data: args.update,
        include: args.include,
        select: args.select,
      });
    }

    return this.create({
      data: args.create,
      include: args.include,
      select: args.select,
    });
  }

  async count(args: QueryArgs = {}): Promise<number> {
    const whereCondition = this.service.buildWhere(this.config, args.where);
    let query = this.service.db.select({ value: drizzleCount() }).from(this.config.table).$dynamic();

    if (whereCondition) {
      query = query.where(whereCondition);
    }

    const [row] = await query;
    return Number(row?.value ?? 0);
  }
}

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  [key: string]: any;

  account!: DrizzleDelegate;
  accountAuthentication!: DrizzleDelegate;
  socialAuthentication!: DrizzleDelegate;
  accountSecurity!: DrizzleDelegate;
  deviceSession!: DrizzleDelegate;
  userBehavior!: DrizzleDelegate;
  shopBusiness!: DrizzleDelegate;
  adminAccess!: DrizzleDelegate;
  accountProfile!: DrizzleDelegate;
  accountPreferences!: DrizzleDelegate;
  keyToken!: DrizzleDelegate;
  refreshTokenUsed!: DrizzleDelegate;
  passwordReset!: DrizzleDelegate;
  adminActivityLog!: DrizzleDelegate;
  inventory!: DrizzleDelegate;
  reservationInventory!: DrizzleDelegate;
  discount!: DrizzleDelegate;
  cart!: DrizzleDelegate;
  cartProduct!: DrizzleDelegate;
  order!: DrizzleDelegate;
  orderItem!: DrizzleDelegate;
  commentClosureTable!: DrizzleDelegate;
  comment!: DrizzleDelegate;
  notificationThread!: DrizzleDelegate;
  notification!: DrizzleDelegate;
  spu!: DrizzleDelegate;
  sku!: DrizzleDelegate;
  category!: DrizzleDelegate;
  categoryClosureTable!: DrizzleDelegate;
  brand!: DrizzleDelegate;
  categoryBrand!: DrizzleDelegate;
  categoryAttr!: DrizzleDelegate;
  skuAttribute!: DrizzleDelegate;

  db!: DatabaseExecutor;
  private pool!: Pool;
  private ownsPool = true;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      acquireTimeoutMillis: 60000,
    });
    this.db = drizzle(this.pool, { schema });
    this.bindDelegates();
  }

  async onModuleInit() {
    await this.pool.query('select 1');
  }

  async onModuleDestroy() {
    if (this.ownsPool) {
      await this.pool.end();
    }
  }

  async gracefulShutdown(application: INestApplication) {
    process.once('beforeExit', async () => {
      await application.close();
    });
  }

  async $transaction<T>(handler: (tx: DrizzleTransactionClient) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: DatabaseExecutor) => handler(DrizzleService.fromExecutor(tx, this.pool)));
  }

  async $queryRaw<T = unknown>(strings: TemplateStringsArray, ...params: unknown[]): Promise<T> {
    const result = await this.db.execute(sql(strings, ...params));
    return ((result as any).rows ?? result) as T;
  }

  async $executeRaw(strings: TemplateStringsArray, ...params: unknown[]) {
    const result = await this.db.execute(sql(strings, ...params));
    return (result as any).rowCount ?? 0;
  }

  buildWhere(config: ModelConfig, where: Record<string, any> = {}, applySoftFilter = true): SQL | undefined {
    const conditions: SQL[] = [];
    const normalizedWhere = this.expandCompositeWhere(config, where ?? {});

    for (const [key, value] of Object.entries(normalizedWhere)) {
      if (value === undefined) {
        continue;
      }

      if (key === 'AND') {
        const parts = (Array.isArray(value) ? value : [value])
          .map((item) => this.buildWhere(config, item, false))
          .filter(Boolean) as SQL[];
        if (parts.length) {
          conditions.push(and(...parts)!);
        }
        continue;
      }

      if (key === 'OR') {
        const parts = (Array.isArray(value) ? value : [value])
          .map((item) => this.buildWhere(config, item, false))
          .filter(Boolean) as SQL[];
        if (parts.length) {
          conditions.push(or(...parts)!);
        }
        continue;
      }

      if (key === 'NOT') {
        const part = this.buildWhere(config, value, false);
        if (part) {
          conditions.push(not(part));
        }
        continue;
      }

      const relation = config.relations?.[key];
      if (relation) {
        const relationCondition = this.buildRelationWhere(config, relation, value);
        if (relationCondition) {
          conditions.push(relationCondition);
        }
        continue;
      }

      const column = config.columns[key];
      if (!column) {
        continue;
      }

      const columnCondition = this.buildColumnCondition(config, key, column, value);
      if (columnCondition) {
        conditions.push(columnCondition);
      }
    }

    if (applySoftFilter && config.softDelete && config.columns.isActive) {
      conditions.push(eq(config.columns.isActive, true));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  buildOrderBy(config: ModelConfig, orderBy: QueryArgs['orderBy'] = []) {
    const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
    return entries.flatMap((order) =>
      Object.entries(order ?? {})
        .map(([field, direction]) => {
          const column = config.columns[field];
          if (!column) {
            return undefined;
          }

          return direction === 'desc' ? desc(column) : asc(column);
        })
        .filter(Boolean),
    ) as SQL[];
  }

  normalizeCreateData(config: ModelConfig, data: Record<string, any> = {}) {
    const normalized: Record<string, any> = {};

    if (ID_MODELS.has(config.name) && config.columns.id && data.id === undefined) {
      normalized.id = cryptoRandomId();
    }

    if (config.timestamps) {
      const now = BigInt(Date.now());
      if (config.columns.createdAt && data.createdAt === undefined) {
        normalized.createdAt = now;
      }
      if (config.columns.updatedAt && data.updatedAt === undefined) {
        normalized.updatedAt = now;
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || !config.columns[key]) {
        continue;
      }

      normalized[key] = this.normalizeValue(config, key, value);
    }

    return normalized;
  }

  normalizeUpdateData(config: ModelConfig, data: Record<string, any> = {}) {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || !config.columns[key]) {
        continue;
      }

      normalized[key] = this.normalizeUpdateValue(config, key, value);
    }

    if (config.timestamps && config.columns.updatedAt && normalized.updatedAt === undefined) {
      normalized.updatedAt = BigInt(Date.now());
    }

    return normalized;
  }

  async applySelection(config: ModelConfig, row: Record<string, any>, args: QueryArgs = {}) {
    if (!row) {
      return row;
    }

    if (args.select) {
      const selected: Record<string, any> = {};

      for (const [key, selector] of Object.entries(args.select)) {
        if (selector === true && key in row) {
          selected[key] = row[key];
          continue;
        }

        const relation = config.relations?.[key];
        if (relation && selector) {
          selected[key] = await this.loadRelation(config, row, relation, selector);
        }
      }

      return selected;
    }

    const shaped = { ...row };

    for (const [key, selector] of Object.entries(args.include ?? {})) {
      const relation = config.relations?.[key];
      if (relation && selector) {
        shaped[key] = await this.loadRelation(config, row, relation, selector);
      }
    }

    return shaped;
  }

  extractIdentityWhere(config: ModelConfig, row: Record<string, any>, fallbackWhere: Record<string, any>) {
    if (config.primaryKey && row[config.primaryKey] !== undefined) {
      return { [config.primaryKey]: row[config.primaryKey] };
    }

    return fallbackWhere;
  }

  private static fromExecutor(db: DatabaseExecutor, pool: Pool): DrizzleTransactionClient {
    const service = Object.create(DrizzleService.prototype) as DrizzleService;
    service.db = db;
    service.pool = pool;
    service.ownsPool = false;
    service.bindDelegates();
    return service as DrizzleTransactionClient;
  }

  private bindDelegates() {
    for (const config of Object.values(modelConfigs)) {
      this[config.name] = new DrizzleDelegate(this, config);
    }
  }

  private async loadRelation(parentConfig: ModelConfig, row: Record<string, any>, relation: RelationConfig, selector: any) {
    const delegate = this[relation.model] as DrizzleDelegate;
    const relationArgs = selector === true ? {} : selector;
    const relationWhere = {
      [relation.foreignField]: row[relation.localField],
      ...(relationArgs.where ?? {}),
    };
    const args = {
      ...relationArgs,
      where: relationWhere,
    };

    return relation.type === 'one' ? delegate.findFirst(args) : delegate.findMany(args);
  }

  private buildRelationWhere(config: ModelConfig, relation: RelationConfig, value: any) {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const targetConfig = modelConfigs[relation.model];
    const linkedCondition = eq(targetConfig.columns[relation.foreignField], config.columns[relation.localField]);

    if ('some' in value) {
      const nested = this.buildWhere(targetConfig, value.some, false);
      const where = nested ? and(linkedCondition, nested) : linkedCondition;
      return exists(this.db.select({ one: sql`1` }).from(targetConfig.table).where(where));
    }

    if ('every' in value) {
      const nested = this.buildWhere(targetConfig, value.every, false);
      const where = nested ? and(linkedCondition, not(nested)) : linkedCondition;
      return notExists(this.db.select({ one: sql`1` }).from(targetConfig.table).where(where));
    }

    if ('none' in value) {
      const nested = this.buildWhere(targetConfig, value.none, false);
      const where = nested ? and(linkedCondition, nested) : linkedCondition;
      return notExists(this.db.select({ one: sql`1` }).from(targetConfig.table).where(where));
    }

    const nested = this.buildWhere(targetConfig, value, false);
    const where = nested ? and(linkedCondition, nested) : linkedCondition;
    return exists(this.db.select({ one: sql`1` }).from(targetConfig.table).where(where));
  }

  private buildColumnCondition(config: ModelConfig, key: string, column: any, value: any): SQL | undefined {
    if (value === null) {
      return isNull(column);
    }

    const normalizedValue = this.normalizeValue(config, key, value);

    if (!this.isFilterObject(normalizedValue)) {
      return eq(column, normalizedValue);
    }

    const conditions: SQL[] = [];

    for (const [operator, operand] of Object.entries(normalizedValue)) {
      const normalizedOperand = this.normalizeValue(config, key, operand);

      switch (operator) {
        case 'equals':
          conditions.push(operand === null ? isNull(column) : eq(column, normalizedOperand));
          break;
        case 'not':
          if (this.isFilterObject(normalizedOperand)) {
            const nested = this.buildColumnCondition(config, key, column, normalizedOperand);
            if (nested) {
              conditions.push(not(nested));
            }
          } else if (operand === null) {
            conditions.push(not(isNull(column)));
          } else {
            conditions.push(ne(column, normalizedOperand));
          }
          break;
        case 'in':
          conditions.push(inArray(column, normalizedOperand as unknown[]));
          break;
        case 'gt':
          conditions.push(gt(column, normalizedOperand));
          break;
        case 'gte':
          conditions.push(gte(column, normalizedOperand));
          break;
        case 'lt':
          conditions.push(lt(column, normalizedOperand));
          break;
        case 'lte':
          conditions.push(lte(column, normalizedOperand));
          break;
        case 'contains':
          conditions.push(ilike(column, `%${String(operand)}%`));
          break;
      }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private expandCompositeWhere(config: ModelConfig, where: Record<string, any>) {
    const expanded = { ...where };

    for (const [key, fields] of Object.entries(config.uniqueKeys ?? {})) {
      const value = expanded[key];
      if (!value || typeof value !== 'object') {
        continue;
      }

      delete expanded[key];
      for (const field of fields) {
        expanded[field] = value[field];
      }
    }

    return expanded;
  }

  private normalizeUpdateValue(config: ModelConfig, key: string, value: any) {
    const column = config.columns[key];

    if (this.isFilterObject(value)) {
      if ('increment' in value) {
        return sql`${column} + ${this.normalizeValue(config, key, value.increment)}`;
      }

      if ('decrement' in value) {
        return sql`${column} - ${this.normalizeValue(config, key, value.decrement)}`;
      }

      if ('set' in value) {
        return this.normalizeValue(config, key, value.set);
      }
    }

    return this.normalizeValue(config, key, value);
  }

  private normalizeValue(config: ModelConfig, key: string, value: any) {
    if (value === undefined || value === null || this.isSql(value)) {
      return value;
    }

    const bigintFields = new Set([...(config.bigintFields ?? []), ...BIGINT_TIMESTAMP_FIELDS]);
    if (bigintFields.has(key) && typeof value === 'number') {
      return BigInt(value);
    }

    if ((config.dateFields ?? []).includes(key) && !(value instanceof Date)) {
      return new Date(value);
    }

    return value;
  }

  private isFilterObject(value: any) {
    return (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !this.isSql(value)
    );
  }

  private isSql(value: any): value is SQL {
    return value && typeof value === 'object' && typeof value.getSQL === 'function';
  }
}

export type DrizzleTransactionClient = DrizzleService;

export const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

const cryptoRandomId = () => {
  return globalThis.crypto?.randomUUID?.() ?? randomUUID();
};
