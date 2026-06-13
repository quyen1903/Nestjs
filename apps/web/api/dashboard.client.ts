import { apiConfig } from "@/api/config";
import { apiRequest } from "@/api/http";
import {
  buildDashboardSummary,
  mockCustomers,
  mockInventory,
  mockOrders,
  mockProducts,
  mockRevenue,
  mockSettings
} from "@/api/mock-data";
import { slugify } from "@/lib/utils";
import type {
  Customer,
  DashboardSummary,
  InventoryItem,
  MerchantSettings,
  Order,
  Product,
  RevenuePoint,
  TenantContext
} from "@/types/domain";

export async function getDashboardSummary(context: TenantContext): Promise<DashboardSummary> {
  return simulate(buildDashboardSummary(context.organizationId));
}

export async function getRevenueSeries(context: TenantContext): Promise<RevenuePoint[]> {
  const multiplier = context.organizationId === "shop-northstar" ? 1 : 0.78;
  return simulate(
    mockRevenue.map((point) => ({
      ...point,
      revenue: Math.round(point.revenue * multiplier)
    }))
  );
}

export async function listMerchantProducts(context: TenantContext): Promise<Product[]> {
  if (apiConfig.mode === "live") {
    try {
      const payload = await apiRequest<unknown[]>("/product/published/all?take=50&skip=0");
      if (Array.isArray(payload) && payload.length > 0) {
        // TODO: normalize and scope by backend-authenticated shop when the route response is stable.
      }
    } catch {
      // Mock fallback remains tenant-scoped below.
    }
  }

  return simulate(mockProducts.filter((product) => product.shopId === context.organizationId));
}

export async function listMerchantOrders(context: TenantContext): Promise<Order[]> {
  return simulate(mockOrders.filter((order) => order.shopId === context.organizationId));
}

export async function listMerchantCustomers(context: TenantContext): Promise<Customer[]> {
  return simulate(mockCustomers.filter((customer) => customer.shopId === context.organizationId));
}

export async function listMerchantInventory(context: TenantContext): Promise<InventoryItem[]> {
  return simulate(mockInventory.filter((item) => item.shopId === context.organizationId));
}

export async function getMerchantSettings(context: TenantContext): Promise<MerchantSettings> {
  return simulate(
    mockSettings.find((settings) => settings.organizationId === context.organizationId) ?? mockSettings[0]
  );
}

export async function updateMerchantSettings(
  context: TenantContext,
  input: MerchantSettings
): Promise<MerchantSettings> {
  return simulate({ ...input, organizationId: context.organizationId });
}

export type ProductMutationInput = {
  name: string;
  intro: string;
  description: string;
  brandId: string;
  brand: string;
  categoryId: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  isPublished: boolean;
};

export async function createMerchantProduct(
  context: TenantContext,
  input: ProductMutationInput
): Promise<Product> {
  if (apiConfig.mode === "live") {
    try {
      await apiRequest("/product/create_product", {
        method: "POST",
        body: toBackendProductPayload(input)
      });
    } catch {
      // TODO: require a live shop session token before enabling production product creation.
    }
  }

  return simulate(toMockProduct(context.organizationId, input));
}

export async function updateMerchantProduct(
  context: TenantContext,
  productId: string,
  input: ProductMutationInput
): Promise<Product> {
  if (apiConfig.mode === "live") {
    try {
      await apiRequest(`/product/${productId}`, {
        method: "PATCH",
        body: {
          name: input.name,
          intro: input.intro,
          price: input.price,
          stock: input.stock
        }
      });
    } catch {
      // TODO: wire backend error display after update route response shape is stable.
    }
  }

  return simulate(toMockProduct(context.organizationId, input, productId));
}

function toBackendProductPayload(input: ProductMutationInput) {
  return {
    spu: {
      name: input.name,
      intro: input.intro,
      brandId: input.brandId,
      categoryId: input.categoryId,
      images: input.image ? [input.image] : [],
      content: input.description,
      isMarketable: input.isPublished,
      status: input.isPublished ? 1 : 0
    },
    sku: {
      name: `${input.name} - Standard`,
      price: Math.round(input.price * 100),
      stock: input.stock,
      image: input.image,
      images: input.image ? [input.image] : [],
      brandName: input.brand,
      attributes: "{}",
      status: input.isPublished ? 1 : 0
    }
  };
}

function toMockProduct(shopId: string, input: ProductMutationInput, id = `prod-${slugify(input.name)}`): Product {
  return {
    id,
    slug: slugify(input.name),
    name: input.name,
    intro: input.intro,
    description: input.description,
    brand: input.brand,
    category: input.category,
    categorySlug: slugify(input.category),
    shopId,
    shopName: shopId === "shop-northstar" ? "Northstar Supply" : "Studio Lane Goods",
    images: [input.image],
    price: input.price,
    currency: "USD",
    rating: 0,
    reviewCount: 0,
    stockEstimate: input.stock,
    stockStatus: input.stock === 0 ? "out_of_stock" : input.stock < 12 ? "low_stock" : "in_stock",
    tags: input.isPublished ? ["Draft ready"] : ["Draft"],
    variants: [
      {
        id: `${id}-standard`,
        name: "Standard",
        price: input.price,
        stockEstimate: input.stock,
        image: input.image,
        attributes: {}
      }
    ],
    isPublished: input.isPublished,
    createdAt: new Date().toISOString()
  };
}

function simulate<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 180);
  });
}
