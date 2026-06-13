"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { CheckoutSummary } from "@/components/storefront/checkout-summary";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { Button } from "@/components/ui/button";
import { useCart, useClearCart, useUpdateCartItem } from "@/features/cart/api/cart.queries";
import { formatCurrency } from "@/lib/utils";

export function CartPage() {
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const clear = useClearCart();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="page-shell space-y-6 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Cart</p>
            <h1 className="text-3xl font-semibold tracking-normal">Review items</h1>
          </div>
          {cart.data && cart.data.items.length > 0 ? (
            <ConfirmDialog
              trigger={
                <Button variant="outline">
                  <Trash2 className="size-4" />
                  Clear
                </Button>
              }
              title="Clear cart"
              description="This removes all items from the local cart view."
              confirmLabel="Clear cart"
              onConfirm={() => clear.mutate()}
            />
          ) : null}
        </div>

        {cart.isLoading ? <LoadingState label="Loading cart" /> : null}
        {cart.isError ? <ErrorState onRetry={() => void cart.refetch()} /> : null}
        {cart.data && cart.data.items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add products from the storefront before checkout."
            actionLabel="Browse products"
            onAction={() => {
              window.location.href = "/products";
            }}
          />
        ) : null}
        {cart.data && cart.data.items.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-3">
              {cart.data.items.map((item) => (
                <article key={item.id} className="grid gap-4 rounded-lg border bg-card p-4 shadow-soft-sm sm:grid-cols-[96px_1fr_auto]">
                  <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.variantName}</p>
                    <p className="mt-3 text-sm font-medium">{formatCurrency(item.unitPrice, item.currency)}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Decrease quantity"
                      onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="grid h-10 min-w-10 place-items-center rounded-md border px-3 text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Increase quantity"
                      onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </section>
            <aside className="space-y-4">
              <CheckoutSummary totals={cart.data.totals} />
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Continue to checkout</Link>
              </Button>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
