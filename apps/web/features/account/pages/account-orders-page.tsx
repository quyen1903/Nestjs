"use client";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountOrders } from "@/features/account/api/account.queries";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";

export function AccountOrdersPage() {
  const { session } = useAuth();
  const orders = useAccountOrders(session);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="page-shell space-y-6 py-8">
        <div>
          <p className="text-sm font-medium text-primary">Account</p>
          <h1 className="text-3xl font-semibold tracking-normal">Orders</h1>
        </div>
        {!session ? <EmptyState title="Login required" description="Order history is scoped to the authenticated user." /> : null}
        {session && orders.isLoading ? <LoadingState label="Loading orders" /> : null}
        {orders.isError ? <ErrorState onRetry={() => void orders.refetch()} /> : null}
        {orders.data && orders.data.length === 0 ? (
          <EmptyState title="No orders" description="Confirmed orders will appear after backend checkout completion." />
        ) : null}
        {orders.data && orders.data.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.status}</Badge>
                      </TableCell>
                      <TableCell>{order.itemCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total, order.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
