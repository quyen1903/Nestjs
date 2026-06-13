"use client";

import Link from "next/link";

import { OrdersTable } from "@/components/dashboard/orders-table";
import { ProductsTable } from "@/components/dashboard/products-table";
import { RevenueChartPlaceholder } from "@/components/dashboard/revenue-chart-placeholder";
import { StatCards } from "@/components/dashboard/stat-cards";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { Button } from "@/components/ui/button";
import {
  useDashboardSummary,
  useMerchantOrders,
  useMerchantProducts,
  useRevenueSeries
} from "@/features/dashboard/api/dashboard.queries";
import { useOrganization } from "@/hooks/use-organization";

export function DashboardOverviewPage() {
  const { tenant } = useOrganization();
  const summary = useDashboardSummary(tenant);
  const revenue = useRevenueSeries(tenant);
  const orders = useMerchantOrders(tenant);
  const products = useMerchantProducts(tenant);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-normal">Commerce Overview</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">New product</Link>
        </Button>
      </div>

      {summary.isLoading ? <LoadingState label="Loading summary" /> : null}
      {summary.isError ? <ErrorState onRetry={() => void summary.refetch()} /> : null}
      {summary.data ? <StatCards summary={summary.data} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {revenue.isLoading ? <LoadingState label="Loading revenue" /> : null}
        {revenue.data ? <RevenueChartPlaceholder data={revenue.data} /> : null}
        {orders.isLoading ? <LoadingState label="Loading orders" /> : null}
        {orders.data && orders.data.length > 0 ? <OrdersTable orders={orders.data.slice(0, 4)} title="Recent Orders" /> : null}
        {orders.data && orders.data.length === 0 ? <EmptyState title="No orders" description="Orders will appear after backend checkout confirmation." /> : null}
      </div>

      {products.isLoading ? <LoadingState label="Loading products" /> : null}
      {products.data && products.data.length > 0 ? <ProductsTable products={products.data.slice(0, 5)} /> : null}
      {products.data && products.data.length === 0 ? <EmptyState title="No products" description="Create a product to start merchandising." /> : null}
    </div>
  );
}
