"use client";

import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMerchantCustomers } from "@/features/dashboard/api/dashboard.queries";
import { useOrganization } from "@/hooks/use-organization";
import { formatCurrency } from "@/lib/utils";

export function DashboardCustomersPage() {
  const { tenant } = useOrganization();
  const customers = useMerchantCustomers(tenant);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Relationships</p>
        <h1 className="text-3xl font-semibold tracking-normal">Customers</h1>
      </div>
      {customers.isLoading ? <LoadingState label="Loading customers" /> : null}
      {customers.isError ? <ErrorState onRetry={() => void customers.refetch()} /> : null}
      {customers.data && customers.data.length === 0 ? (
        <EmptyState title="No customers" description="Customer records are scoped to the selected organization." />
      ) : null}
      {customers.data && customers.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.segment}</Badge>
                    </TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.totalSpend, customer.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
