"use client";

import Image from "next/image";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { Edit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/domain";

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <div className="flex min-w-[260px] items-center gap-3">
        <div className="relative size-12 overflow-hidden rounded-md bg-secondary">
          <Image src={row.original.images[0]} alt="" fill sizes="48px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.brand}</p>
        </div>
      </div>
    )
  },
  {
    accessorKey: "category",
    header: "Category"
  },
  {
    accessorKey: "stockStatus",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.stockStatus === "low_stock" ? "outline" : "secondary"}>
        {row.original.stockStatus.replaceAll("_", " ")}
      </Badge>
    )
  },
  {
    accessorKey: "price",
    header: () => <span className="block text-right">Price</span>,
    cell: ({ row }) => (
      <span className="block text-right font-medium">
        {formatCurrency(row.original.price, row.original.currency)}
      </span>
    )
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button asChild variant="outline" size="icon" aria-label={`Edit ${row.original.name}`}>
        <Link href={`/dashboard/products/${row.original.id}/edit`}>
          <Edit className="size-4" />
        </Link>
      </Button>
    )
  }
];

export function ProductsTable({ products }: { products: Product[] }) {
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
