"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { ProductFilters } from "@/components/storefront/product-filters";
import { ProductGrid } from "@/components/storefront/product-grid";
import { useCategories, useProducts } from "@/features/products/api/product.queries";
import type { ProductFilters as ProductFilterValues } from "@/types/domain";

export function ProductsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") ?? "";
  const [filters, setFilters] = useState<ProductFilterValues>({
    query: initialQuery,
    page: 1,
    limit: 12,
    sort: "featured"
  });
  const queryFilters = useMemo(() => filters, [filters]);
  const products = useProducts(queryFilters);
  const categories = useCategories();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <StorefrontHeader />
      <main className="page-shell space-y-6 py-8">
        <div>
          <p className="text-sm font-medium text-primary">Catalog</p>
          <h2 className="text-3xl font-semibold tracking-normal">Products</h2>
        </div>
        <ProductFilters categories={categories.data ?? []} value={filters} onChange={setFilters} />
        {products.isLoading ? <LoadingState label="Loading products" /> : null}
        {products.isError ? <ErrorState onRetry={() => void products.refetch()} /> : null}
        {products.data && products.data.items.length === 0 ? (
          <EmptyState title="No products found" description="Adjust filters or search terms to broaden the catalog." />
        ) : null}
        {products.data && products.data.items.length > 0 ? (
          <>
            <ProductGrid products={products.data.items} />
            <Pagination
              page={products.data.page}
              totalPages={products.data.totalPages}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
