import { apiConfig } from "@/api/config";
import { apiRequest } from "@/api/http";
import { mockCategories, mockProducts } from "@/api/mock-data";
import { slugify } from "@/lib/utils";
import type { Category, PageResult, Product, ProductFilters } from "@/types/domain";

export async function listProducts(filters: ProductFilters = {}): Promise<PageResult<Product>> {
  if (apiConfig.mode === "live") {
    try {
      const params = new URLSearchParams({
        take: String(filters.limit ?? 24),
        skip: String(((filters.page ?? 1) - 1) * (filters.limit ?? 24)),
        isPublished: "true"
      });
      const payload = await apiRequest<unknown[]>(`/product/all?${params.toString()}`);
      return paginate(normalizeProducts(payload), filters);
    } catch {
      // TODO: replace fallback once the backend product list response is stable.
    }
  }

  return simulate(paginate(mockProducts, filters));
}

export async function listCategories(): Promise<Category[]> {
  if (apiConfig.mode === "live") {
    try {
      const payload = await apiRequest<unknown[]>("/category");
      return payload.map((category) => normalizeCategory(category));
    } catch {
      // TODO: wire category reads after the backend category response is finalized.
    }
  }

  return simulate(mockCategories);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (apiConfig.mode === "live") {
    try {
      const payload = await apiRequest<unknown>(`/product/productByName/${encodeURIComponent(slug)}`);
      return normalizeProduct(payload);
    } catch {
      // TODO: add a dedicated slug endpoint or pass canonical product IDs from routes.
    }
  }

  return simulate(mockProducts.find((product) => product.slug === slug) ?? null);
}

export async function listProductsByCategory(slug: string, filters: ProductFilters = {}) {
  const products = mockProducts.filter((product) => product.categorySlug === slug);
  return simulate(paginate(products, filters));
}

function paginate(products: Product[], filters: ProductFilters): PageResult<Product> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const query = filters.query?.trim().toLowerCase();

  let rows = products.filter((product) => {
    const matchesQuery = query
      ? [product.name, product.brand, product.category, product.intro].join(" ").toLowerCase().includes(query)
      : true;
    const matchesCategory = filters.category ? product.categorySlug === filters.category : true;
    const matchesMin = filters.minPrice === undefined ? true : product.price >= filters.minPrice;
    const matchesMax = filters.maxPrice === undefined ? true : product.price <= filters.maxPrice;
    return matchesQuery && matchesCategory && matchesMin && matchesMax;
  });

  rows = rows.sort((left, right) => {
    if (filters.sort === "price_asc") return left.price - right.price;
    if (filters.sort === "price_desc") return right.price - left.price;
    if (filters.sort === "rating") return right.rating - left.rating;
    if (filters.sort === "newest") return right.createdAt.localeCompare(left.createdAt);
    return Number(right.tags.includes("Bestseller")) - Number(left.tags.includes("Bestseller"));
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: rows.slice(start, start + limit),
    page,
    limit,
    total,
    totalPages
  };
}

function normalizeProducts(payload: unknown[]): Product[] {
  return payload.map(normalizeProduct).filter((product): product is Product => Boolean(product));
}

function normalizeProduct(payload: unknown): Product | null {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as Record<string, any>;
  const sku = Array.isArray(source.skus) ? source.skus[0] : source.sku;
  const price = Number(sku?.price ?? source.price ?? 0);
  const images = collectImages(source.images, source.image, sku?.images, sku?.image);
  const name = String(source.name ?? sku?.name ?? "Untitled product");
  const category = String(source.category?.name ?? source.category ?? "General");

  return {
    id: String(source.id ?? source.productId ?? sku?.id ?? slugify(name)),
    slug: slugify(name),
    name,
    intro: String(source.intro ?? source.description ?? ""),
    description: String(source.content ?? source.description ?? source.intro ?? ""),
    brand: String(source.brand?.name ?? source.brandName ?? sku?.brandName ?? "Marketplace"),
    category,
    categorySlug: slugify(category),
    shopId: String(source.shopBusinessId ?? source.shopId ?? "unknown-shop"),
    shopName: String(source.shop?.name ?? "Marketplace shop"),
    images,
    price: price > 9999 ? price / 100 : price,
    compareAtPrice: undefined,
    currency: "USD",
    rating: Number(source.rating ?? 4.5),
    reviewCount: Number(source.reviewCount ?? source.reviews ?? 0),
    stockEstimate: Number(sku?.stock ?? source.stock ?? 0),
    stockStatus: Number(sku?.stock ?? source.stock ?? 0) > 0 ? "in_stock" : "out_of_stock",
    tags: [],
    variants: [
      {
        id: String(sku?.id ?? source.id ?? "default"),
        name: String(sku?.name ?? name),
        price: price > 9999 ? price / 100 : price,
        stockEstimate: Number(sku?.stock ?? source.stock ?? 0),
        image: images[0],
        attributes: parseAttributes(sku?.attributes)
      }
    ],
    isPublished: Boolean(source.isPublished ?? source.isMarketable ?? true),
    createdAt: new Date(Number(source.createdAt) || Date.now()).toISOString()
  };
}

function normalizeCategory(payload: unknown): Category {
  const source = (payload ?? {}) as Record<string, any>;
  const name = String(source.name ?? "Category");
  return {
    id: String(source.id ?? slugify(name)),
    name,
    slug: slugify(name),
    description: "",
    productCount: 0
  };
}

function collectImages(...values: unknown[]): string[] {
  const result = values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  return result.length
    ? result
    : ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=82"];
}

function parseAttributes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "string") return {};
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

function simulate<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 180);
  });
}
