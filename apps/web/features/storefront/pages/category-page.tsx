"use client";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { ProductGrid } from "@/components/storefront/product-grid";
import { useCategories, useCategoryProducts } from "@/features/products/api/product.queries";

export function CategoryPage({ slug }: { slug: string }) {
  const categories = useCategories();
  const products = useCategoryProducts(slug, { page: 1, limit: 24 });
  const category = categories.data?.find((item) => item.slug === slug);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <StorefrontHeader />
      <main className="page-shell space-y-6 py-8">
        <div>
          <p className="text-sm font-medium text-primary">Category</p>
          <h2 className="text-3xl font-semibold tracking-normal">{category?.name ?? "Category"}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{category?.description}</p>
        </div>
        {products.isLoading ? <LoadingState label="Loading category products" /> : null}
        {products.isError ? <ErrorState onRetry={() => void products.refetch()} /> : null}
        {products.data?.items.length === 0 ? (
          <EmptyState title="No category products" description="This category has no available products yet." />
        ) : null}
        {products.data && products.data.items.length > 0 ? <ProductGrid products={products.data.items} /> : null}
      </main>
    </div>
  );
}
