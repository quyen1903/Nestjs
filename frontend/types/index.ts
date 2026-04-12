// API Response Types
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  metadata: T;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  fullName?: string;
}

export interface AuthResponse {
  accountId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  userType: 'USER' | 'SHOP' | 'ADMIN';
  profile?: AccountProfile;
}

export interface AccountProfile {
  id: string;
  email: string;
  phoneNumber?: string;
  fullName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecodedToken {
  accountId: string;
  email: string;
  userType: 'USER' | 'SHOP' | 'ADMIN';
  iat: number;
  exp: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  images: string[];
  rating: number;
  reviews: number;
  shopId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  search?: string;
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  sort?: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING';
  page?: number;
  limit?: number;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Cart {
  id: string;
  accountId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
}

// Order Types
export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

export interface Order {
  id: string;
  accountId: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CheckoutRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: string;
  paymentMethod: 'STRIPE' | 'COD';
  discountCode?: string;
}

// Discount Types
export interface Discount {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  minPurchase?: number;
  applicableCategories?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

// Comment/Review Types
export interface Comment {
  id: string;
  productId: string;
  accountId: string;
  content: string;
  rating: number;
  parentId?: string;
  children?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    total: number;
    limit: number;
    hasMore: boolean;
  };
}

// Error Types
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, any>;
}

// Socket Event Types
export interface SocketEventPayload {
  type: string;
  data: any;
}

export interface StockUpdateEvent {
  productId: string;
  newStock: number;
  timestamp: string;
}

export interface OrderStatusUpdateEvent {
  orderId: string;
  status: string;
  timestamp: string;
}
