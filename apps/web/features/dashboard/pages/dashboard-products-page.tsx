"use client";

import Link from "next/link";

import { ProductsTable } from "@/components/dashboard/products-table";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { Button } from "@/components/ui/button";
import { useMerchantProducts } from "@/features/dashboard/api/dashboard.queries";
import { useOrganization } from "@/hooks/use-organization";

export function DashboardProductsPage() {
  const { tenant } = useOrganization();
  const products = useMerchantProducts(tenant);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Catalog</p>
          <h1 className="text-3xl font-semibold tracking-normal">Products</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">New product</Link>
        </Button>
      </div>
      {products.isLoading ? <LoadingState label="Loading products" /> : null}
      {products.isError ? <ErrorState onRetry={() => void products.refetch()} /> : null}
      {products.data && products.data.length === 0 ? (
        <EmptyState title="No products" description="Create the first product for this organization." />
      ) : null}
      {products.data && products.data.length > 0 ? <ProductsTable products={products.data} /> : null}
    </div>
  );
}
