"use client";

import { OrdersTable } from "@/components/dashboard/orders-table";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { useMerchantOrders } from "@/features/dashboard/api/dashboard.queries";
import { useOrganization } from "@/hooks/use-organization";

export function DashboardOrdersPage() {
  const { tenant } = useOrganization();
  const orders = useMerchantOrders(tenant);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Operations</p>
        <h1 className="text-3xl font-semibold tracking-normal">Orders</h1>
      </div>
      {orders.isLoading ? <LoadingState label="Loading orders" /> : null}
      {orders.isError ? <ErrorState onRetry={() => void orders.refetch()} /> : null}
      {orders.data && orders.data.length === 0 ? (
        <EmptyState title="No orders" description="Shop-scoped orders will appear here after checkout confirmation." />
      ) : null}
      {orders.data && orders.data.length > 0 ? <OrdersTable orders={orders.data} /> : null}
    </div>
  );
}
