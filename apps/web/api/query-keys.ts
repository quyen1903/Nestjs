export const queryKeys = {
  products: (filters?: object) => ["products", filters] as const,
  categories: ["categories"] as const,
  product: (slug: string) => ["product", slug] as const,
  categoryProducts: (slug: string, filters?: object) => ["category-products", slug, filters] as const,
  cart: ["cart"] as const,
  checkoutReview: ["checkout-review"] as const,
  dashboardSummary: (organizationId: string) => ["dashboard-summary", organizationId] as const,
  revenue: (organizationId: string) => ["revenue", organizationId] as const,
  merchantProducts: (organizationId: string) => ["merchant-products", organizationId] as const,
  merchantOrders: (organizationId: string) => ["merchant-orders", organizationId] as const,
  merchantCustomers: (organizationId: string) => ["merchant-customers", organizationId] as const,
  merchantInventory: (organizationId: string) => ["merchant-inventory", organizationId] as const,
  merchantSettings: (organizationId: string) => ["merchant-settings", organizationId] as const,
  accountOrders: (actorId?: string) => ["account-orders", actorId] as const
};
