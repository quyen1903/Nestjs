import { slugify } from "@/lib/utils";
import type {
  Cart,
  Category,
  Customer,
  DashboardSummary,
  InventoryItem,
  MerchantSettings,
  Order,
  Organization,
  Product,
  RevenuePoint
} from "@/types/domain";

const images = {
  desk: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=82",
  bag: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=82",
  audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=82",
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=82",
  bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1400&q=82",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=82",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=82",
  lamp: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=82",
  jacket: "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1400&q=82"
};

export const mockOrganizations: Organization[] = [
  { id: "shop-northstar", name: "Northstar Supply", role: "Owner" },
  { id: "shop-studio-lane", name: "Studio Lane Goods", role: "Manager" }
];

export const mockCategories: Category[] = [
  {
    id: "cat-workspace",
    name: "Workspace",
    slug: "workspace",
    description: "Focused tools for desks, teams, and creators.",
    productCount: 4
  },
  {
    id: "cat-travel",
    name: "Travel",
    slug: "travel",
    description: "Everyday carry and durable movement gear.",
    productCount: 2
  },
  {
    id: "cat-audio",
    name: "Audio",
    slug: "audio",
    description: "Headphones, speakers, and listening accessories.",
    productCount: 2
  },
  {
    id: "cat-style",
    name: "Style",
    slug: "style",
    description: "Wearables, apparel, and considered essentials.",
    productCount: 1
  }
];

export const mockProducts: Product[] = [
  buildProduct({
    id: "prod-desk-dock",
    name: "Modular Desk Dock",
    intro: "Aluminum desktop dock with routed power, device stands, and swappable trays.",
    category: "Workspace",
    brand: "Northline",
    shopId: "shop-northstar",
    shopName: "Northstar Supply",
    image: images.desk,
    price: 189,
    compareAtPrice: 229,
    stockEstimate: 42,
    rating: 4.8,
    reviewCount: 316,
    tags: ["Bestseller", "Ships today"]
  }),
  buildProduct({
    id: "prod-runner-pack",
    name: "Commuter Runner Pack",
    intro: "Weather resistant 22L pack with laptop suspension and segmented storage.",
    category: "Travel",
    brand: "Vero",
    shopId: "shop-northstar",
    shopName: "Northstar Supply",
    image: images.bag,
    price: 148,
    stockEstimate: 18,
    rating: 4.6,
    reviewCount: 204,
    tags: ["Low stock", "Water resistant"]
  }),
  buildProduct({
    id: "prod-studio-headphones",
    name: "Studio Reference Headphones",
    intro: "Closed-back wireless headphones tuned for calls, editing, and long work sessions.",
    category: "Audio",
    brand: "Aural Lab",
    shopId: "shop-studio-lane",
    shopName: "Studio Lane Goods",
    image: images.audio,
    price: 249,
    compareAtPrice: 299,
    stockEstimate: 63,
    rating: 4.9,
    reviewCount: 518,
    tags: ["Top rated", "Noise canceling"]
  }),
  buildProduct({
    id: "prod-creator-camera",
    name: "Mirrorless Creator Kit",
    intro: "Compact camera kit with a prime lens, cage, and travel case for mobile studios.",
    category: "Workspace",
    brand: "Lumio",
    shopId: "shop-studio-lane",
    shopName: "Studio Lane Goods",
    image: images.camera,
    price: 899,
    stockEstimate: 11,
    rating: 4.7,
    reviewCount: 142,
    tags: ["Creator kit", "Warranty"]
  }),
  buildProduct({
    id: "prod-steel-bottle",
    name: "Insulated Steel Bottle",
    intro: "Double-wall bottle with a ceramic-lined interior and leak-proof carry cap.",
    category: "Travel",
    brand: "Miro",
    shopId: "shop-northstar",
    shopName: "Northstar Supply",
    image: images.bottle,
    price: 38,
    stockEstimate: 96,
    rating: 4.5,
    reviewCount: 88,
    tags: ["Reusable", "New"]
  }),
  buildProduct({
    id: "prod-minimal-watch",
    name: "Minimal Field Watch",
    intro: "Sapphire crystal watch with a brushed case and quick-release strap.",
    category: "Style",
    brand: "Northline",
    shopId: "shop-studio-lane",
    shopName: "Studio Lane Goods",
    image: images.watch,
    price: 176,
    stockEstimate: 24,
    rating: 4.4,
    reviewCount: 73,
    tags: ["Giftable"]
  }),
  buildProduct({
    id: "prod-mechanical-keyboard",
    name: "Low Profile Mechanical Keyboard",
    intro: "Hot-swap keyboard with quiet tactile switches and multi-device pairing.",
    category: "Workspace",
    brand: "Keystone",
    shopId: "shop-northstar",
    shopName: "Northstar Supply",
    image: images.keyboard,
    price: 132,
    compareAtPrice: 159,
    stockEstimate: 5,
    rating: 4.6,
    reviewCount: 192,
    tags: ["Low stock", "Hot swap"]
  }),
  buildProduct({
    id: "prod-focus-lamp",
    name: "Focus Task Lamp",
    intro: "Slim dimmable task lamp with a glare-controlled head and USB-C power.",
    category: "Workspace",
    brand: "Angle",
    shopId: "shop-studio-lane",
    shopName: "Studio Lane Goods",
    image: images.lamp,
    price: 94,
    stockEstimate: 0,
    rating: 4.2,
    reviewCount: 61,
    tags: ["Back soon"]
  }),
  buildProduct({
    id: "prod-shell-jacket",
    name: "Packable Shell Jacket",
    intro: "Breathable wind shell with taped seams and a compact pocket pack.",
    category: "Style",
    brand: "Strata",
    shopId: "shop-northstar",
    shopName: "Northstar Supply",
    image: images.jacket,
    price: 124,
    stockEstimate: 31,
    rating: 4.5,
    reviewCount: 117,
    tags: ["Outdoor"]
  })
];

export const mockOrders: Order[] = [
  {
    id: "ORD-1048",
    shopId: "shop-northstar",
    customerName: "Maya Chen",
    customerEmail: "maya.chen@example.test",
    status: "PROCESSING",
    itemCount: 3,
    total: 365,
    currency: "USD",
    createdAt: "2026-06-10T10:21:00.000Z",
    fulfillment: "Partially fulfilled"
  },
  {
    id: "ORD-1047",
    shopId: "shop-northstar",
    customerName: "Owen Price",
    customerEmail: "owen.price@example.test",
    status: "CONFIRMED",
    itemCount: 1,
    total: 148,
    currency: "USD",
    createdAt: "2026-06-09T16:12:00.000Z",
    fulfillment: "Unfulfilled"
  },
  {
    id: "ORD-1046",
    shopId: "shop-studio-lane",
    customerName: "Priya Shah",
    customerEmail: "priya.shah@example.test",
    status: "SHIPPED",
    itemCount: 2,
    total: 425,
    currency: "USD",
    createdAt: "2026-06-08T09:35:00.000Z",
    fulfillment: "Fulfilled"
  },
  {
    id: "ORD-1045",
    shopId: "shop-studio-lane",
    customerName: "Alex Morgan",
    customerEmail: "alex.morgan@example.test",
    status: "PENDING_PAYMENT",
    itemCount: 1,
    total: 899,
    currency: "USD",
    createdAt: "2026-06-07T19:04:00.000Z",
    fulfillment: "Unfulfilled"
  }
];

export const mockCustomers: Customer[] = [
  {
    id: "cus-001",
    shopId: "shop-northstar",
    name: "Maya Chen",
    email: "maya.chen@example.test",
    orders: 8,
    totalSpend: 1840,
    currency: "USD",
    lastSeenAt: "2026-06-10T14:22:00.000Z",
    segment: "VIP"
  },
  {
    id: "cus-002",
    shopId: "shop-northstar",
    name: "Owen Price",
    email: "owen.price@example.test",
    orders: 2,
    totalSpend: 326,
    currency: "USD",
    lastSeenAt: "2026-06-09T16:12:00.000Z",
    segment: "Returning"
  },
  {
    id: "cus-003",
    shopId: "shop-studio-lane",
    name: "Priya Shah",
    email: "priya.shah@example.test",
    orders: 4,
    totalSpend: 1188,
    currency: "USD",
    lastSeenAt: "2026-06-08T09:35:00.000Z",
    segment: "Returning"
  }
];

export const mockInventory: InventoryItem[] = mockProducts.map((product, index) => ({
  id: `inv-${product.id}`,
  shopId: product.shopId,
  sku: product.variants[0]?.id ?? product.id,
  productName: product.name,
  location: index % 2 === 0 ? "Main warehouse" : "Retail backroom",
  available: product.stockEstimate,
  reserved: Math.max(0, Math.round(product.stockEstimate * 0.12)),
  reorderPoint: index % 3 === 0 ? 20 : 10,
  status: product.stockEstimate === 0 ? "Out" : product.stockEstimate < 12 ? "Low" : "Healthy"
}));

export const mockRevenue: RevenuePoint[] = [
  { label: "Mon", revenue: 1820, orders: 18 },
  { label: "Tue", revenue: 2210, orders: 21 },
  { label: "Wed", revenue: 1980, orders: 19 },
  { label: "Thu", revenue: 2760, orders: 27 },
  { label: "Fri", revenue: 3110, orders: 31 },
  { label: "Sat", revenue: 2940, orders: 26 },
  { label: "Sun", revenue: 3320, orders: 29 }
];

export const mockSettings: MerchantSettings[] = mockOrganizations.map((organization) => ({
  organizationId: organization.id,
  storeName: organization.name,
  supportEmail: `${slugify(organization.name)}@example.test`,
  defaultCurrency: "USD",
  orderPrefix: organization.id === "shop-northstar" ? "NS" : "SL",
  emailNotifications: true,
  lowStockAlerts: true
}));

export let mockCart: Cart = {
  id: "cart-demo",
  items: [],
  totals: {
    subtotal: 0,
    discount: 0,
    taxEstimate: 0,
    shippingEstimate: 0,
    totalEstimate: 0,
    currency: "USD",
    estimateOnly: true
  }
};

export function setMockCart(nextCart: Cart) {
  mockCart = nextCart;
}

export function buildDashboardSummary(shopId: string): DashboardSummary {
  const orders = mockOrders.filter((order) => order.shopId === shopId);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return {
    revenue,
    orders: orders.length,
    conversionRate: shopId === "shop-northstar" ? 4.8 : 3.9,
    averageOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
    currency: "USD"
  };
}

function buildProduct(input: {
  id: string;
  name: string;
  intro: string;
  brand: string;
  category: string;
  shopId: string;
  shopName: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  stockEstimate: number;
  rating: number;
  reviewCount: number;
  tags: string[];
}): Product {
  const categorySlug = slugify(input.category);

  return {
    id: input.id,
    slug: slugify(input.name),
    name: input.name,
    intro: input.intro,
    description:
      `${input.intro} Built for modern storefront operations with clear merchandising, reliable fulfillment handoff, and customer-ready presentation.`,
    brand: input.brand,
    category: input.category,
    categorySlug,
    shopId: input.shopId,
    shopName: input.shopName,
    images: [input.image],
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    currency: "USD",
    rating: input.rating,
    reviewCount: input.reviewCount,
    stockEstimate: input.stockEstimate,
    stockStatus:
      input.stockEstimate === 0 ? "out_of_stock" : input.stockEstimate < 12 ? "low_stock" : "in_stock",
    tags: input.tags,
    variants: [
      {
        id: `${input.id}-standard`,
        name: "Standard",
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        stockEstimate: input.stockEstimate,
        image: input.image,
        attributes: { finish: "Standard" }
      }
    ],
    isPublished: input.stockEstimate > 0,
    createdAt: "2026-06-01T09:00:00.000Z"
  };
}
