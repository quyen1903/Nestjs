"use client";

import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMerchantInventory } from "@/features/dashboard/api/dashboard.queries";
import { useOrganization } from "@/hooks/use-organization";

export function DashboardInventoryPage() {
  const { tenant } = useOrganization();
  const inventory = useMerchantInventory(tenant);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Stock</p>
        <h1 className="text-3xl font-semibold tracking-normal">Inventory</h1>
      </div>
      {inventory.isLoading ? <LoadingState label="Loading inventory" /> : null}
      {inventory.isError ? <ErrorState onRetry={() => void inventory.refetch()} /> : null}
      {inventory.data && inventory.data.length === 0 ? (
        <EmptyState title="No inventory" description="Inventory rows are scoped to the selected organization." />
      ) : null}
      {inventory.data && inventory.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Stock Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Reorder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Healthy" ? "secondary" : "outline"}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{item.available}</TableCell>
                    <TableCell>{item.reserved}</TableCell>
                    <TableCell>{item.reorderPoint}</TableCell>
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
