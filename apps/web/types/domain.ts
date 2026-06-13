export type ActorRole = "USER" | "SHOP" | "ADMIN";

export type ApiMode = "mock" | "live";

export type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
  metadata?: T;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TenantContext = {
  organizationId: string;
  actorType: "shop" | "admin";
};

export type AuthSession = {
  actorId: string;
  role: ActorRole;
  email: string;
  displayName: string;
  organizationId?: string;
  accessToken?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
};

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stockEstimate: number;
  image?: string;
  attributes: Record<string, string>;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  intro: string;
  description: string;
  brand: string;
  category: string;
  categorySlug: string;
  shopId: string;
  shopName: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  stockEstimate: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  tags: string[];
  variants: ProductVariant[];
  isPublished: boolean;
  createdAt: string;
};

export type ProductFilters = {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "newest" | "price_asc" | "price_desc" | "rating";
  page?: number;
  limit?: number;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  shopId: string;
  name: string;
  variantName: string;
  image: string;
  unitPrice: number;
  quantity: number;
  currency: string;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  taxEstimate: number;
  shippingEstimate: number;
  totalEstimate: number;
  currency: string;
  estimateOnly: true;
};

export type Cart = {
  id: string;
  items: CartItem[];
  totals: CartTotals;
};

export type CheckoutReview = {
  cartId: string;
  items: CartItem[];
  totals: CartTotals;
  warnings: string[];
  paymentPlaceholder: boolean;
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type Order = {
  id: string;
  shopId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  itemCount: number;
  total: number;
  currency: string;
  createdAt: string;
  fulfillment: "Unfulfilled" | "Partially fulfilled" | "Fulfilled";
};

export type Customer = {
  id: string;
  shopId: string;
  name: string;
  email: string;
  orders: number;
  totalSpend: number;
  currency: string;
  lastSeenAt: string;
  segment: "New" | "Returning" | "VIP";
};

export type InventoryItem = {
  id: string;
  shopId: string;
  sku: string;
  productName: string;
  location: string;
  available: number;
  reserved: number;
  reorderPoint: number;
  status: "Healthy" | "Low" | "Out";
};

export type DashboardSummary = {
  revenue: number;
  orders: number;
  conversionRate: number;
  averageOrderValue: number;
  currency: string;
};

export type RevenuePoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type Organization = {
  id: string;
  name: string;
  role: "Owner" | "Manager" | "Analyst";
};

export type MerchantSettings = {
  organizationId: string;
  storeName: string;
  supportEmail: string;
  defaultCurrency: "USD" | "VND" | "EUR";
  orderPrefix: string;
  emailNotifications: boolean;
  lowStockAlerts: boolean;
};
