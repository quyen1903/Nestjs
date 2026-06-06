import type {
  accountAuthentication,
  accountPreferences,
  accountProfiles,
  accountSecurity,
  accounts,
  adminAccess,
  adminActivityLogs,
  brand,
  cartProducts,
  carts,
  category,
  categoryAttr,
  categoryBrand,
  categoryClosureTable,
  commentClosureTable,
  comments,
  deviceSessions,
  discounts,
  inventories,
  keyTokens,
  notifications,
  notificationThreads,
  orderItems,
  orders,
  passwordResets,
  refreshTokensUsed,
  reservationInventories,
  shopBusiness,
  sku,
  skuAttribute,
  socialAuthentication,
  spu,
  userBehavior,
} from './schema';

const enumObject = <T extends readonly string[]>(values: T) =>
  Object.freeze(
    values.reduce(
      (acc, value) => ({ ...acc, [value]: value }),
      {} as { [K in T[number]]: K },
    ),
  );

export const AccountType = enumObject(['USER', 'SHOP', 'ADMIN', 'SUPER_ADMIN'] as const);
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const AuthMethod = enumObject(['EMAIL_PASSWORD', 'OAUTH2_ONLY', 'HYBRID'] as const);
export type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod];

export const AdminLevel = enumObject(['JUNIOR', 'SENIOR', 'MANAGER', 'DIRECTOR', 'SUPER'] as const);
export type AdminLevel = (typeof AdminLevel)[keyof typeof AdminLevel];

export const AccountRole = enumObject(['SHOP', 'USER'] as const);
export type AccountRole = (typeof AccountRole)[keyof typeof AccountRole];

export const CartState = enumObject(['ACTIVE', 'COMPLETE', 'FAIL', 'PENDING'] as const);
export type CartState = (typeof CartState)[keyof typeof CartState];

export const RoleShop = enumObject(['SHOP', 'WRITER', 'EDITOR', 'ADMIN'] as const);
export type RoleShop = (typeof RoleShop)[keyof typeof RoleShop];

export const Status = enumObject(['ACTIVE', 'INACTIVE', 'PENDING'] as const);
export type Status = (typeof Status)[keyof typeof Status];

export const CommentType = enumObject(['TEXT', 'HTML', 'MARKDOWN'] as const);
export type CommentType = (typeof CommentType)[keyof typeof CommentType];

export const CommentTargetType = enumObject([
  'PRODUCT',
  'ORDER',
  'REVIEW',
  'SHOP',
  'BLOG_POST',
  'ANNOUNCEMENT',
] as const);
export type CommentTargetType = (typeof CommentTargetType)[keyof typeof CommentTargetType];

export const CommentAuthorType = enumObject(['USER', 'SHOP', 'ADMIN', 'SYSTEM'] as const);
export type CommentAuthorType = (typeof CommentAuthorType)[keyof typeof CommentAuthorType];

export const CommentStatus = enumObject([
  'DRAFT',
  'PUBLISHED',
  'PENDING',
  'REJECTED',
  'HIDDEN',
  'SPAM',
] as const);
export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

export const DiscountAppliesTo = enumObject(['all', 'specific'] as const);
export type DiscountAppliesTo = (typeof DiscountAppliesTo)[keyof typeof DiscountAppliesTo];

export const OrderStatus = enumObject(['PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'DELIVERED'] as const);
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const NotificationType = enumObject(['PRODUCT', 'DISCOUNT'] as const);
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const Sex = enumObject(['MALE', 'FEMALE'] as const);
export type Sex = (typeof Sex)[keyof typeof Sex];

export const MessageType = enumObject(['USER_TO_SHOP', 'SHOP_TO_USER'] as const);
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const UserSocialProvider = enumObject(['GOOGLE', 'FACEBOOK'] as const);
export type UserSocialProvider = (typeof UserSocialProvider)[keyof typeof UserSocialProvider];

export type Account = typeof accounts.$inferSelect;
export type AccountAuthentication = typeof accountAuthentication.$inferSelect;
export type SocialAuthentication = typeof socialAuthentication.$inferSelect;
export type AccountSecurity = typeof accountSecurity.$inferSelect;
export type DeviceSession = typeof deviceSessions.$inferSelect;
export type UserBehavior = typeof userBehavior.$inferSelect;
export type ShopBusiness = typeof shopBusiness.$inferSelect;
export type AdminAccess = typeof adminAccess.$inferSelect;
export type AccountProfile = typeof accountProfiles.$inferSelect;
export type AccountPreferences = typeof accountPreferences.$inferSelect;
export type KeyToken = typeof keyTokens.$inferSelect;
export type RefreshTokenUsed = typeof refreshTokensUsed.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type Inventory = typeof inventories.$inferSelect;
export type ReservationInventory = typeof reservationInventories.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartProduct = typeof cartProducts.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type CommentClosureTable = typeof commentClosureTable.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type NotificationThread = typeof notificationThreads.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Spu = typeof spu.$inferSelect;
export type Sku = typeof sku.$inferSelect;
export type Category = typeof category.$inferSelect;
export type CategoryClosureTable = typeof categoryClosureTable.$inferSelect;
export type Brand = typeof brand.$inferSelect;
export type CategoryBrand = typeof categoryBrand.$inferSelect;
export type CategoryAttr = typeof categoryAttr.$inferSelect;
export type SkuAttribute = typeof skuAttribute.$inferSelect;
