"use client";

import Link from "next/link";
import { ShieldCheck, ShoppingCart, Star } from "lucide-react";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { ProductDetailGallery } from "@/components/storefront/product-detail-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddCartItem } from "@/features/cart/api/cart.queries";
import { useProduct } from "@/features/products/api/product.queries";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";

export function ProductDetailPage({ slug }: { slug: string }) {
  const { session } = useAuth();
  const product = useProduct(slug);
  const addToCart = useAddCartItem(session);

  if (product.isLoading) {
    return (
      <div className="min-h-screen">
        <MarketingNavbar />
        <main className="page-shell py-8">
          <LoadingState label="Loading product" />
        </main>
      </div>
    );
  }

  if (product.isError) {
    return (
      <div className="min-h-screen">
        <MarketingNavbar />
        <main className="page-shell py-8">
          <ErrorState onRetry={() => void product.refetch()} />
        </main>
      </div>
    );
  }

  if (!product.data) {
    return (
      <div className="min-h-screen">
        <MarketingNavbar />
        <main className="page-shell py-8">
          <EmptyState title="Product not found" description="The product does not exist in the current catalog." />
        </main>
      </div>
    );
  }

  const current = product.data;
  const variant = current.variants[0];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="page-shell grid gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <ProductDetailGallery images={current.images} name={current.name} />
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{current.category}</Badge>
              <Badge variant="outline">{current.shopName}</Badge>
            </div>
            <h1 className="text-4xl font-semibold tracking-normal">{current.name}</h1>
            <p className="text-lg leading-8 text-muted-foreground">{current.intro}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <Star className="size-4 fill-accent text-accent" />
              <strong>{current.rating.toFixed(1)}</strong>
              <span className="text-muted-foreground">({current.reviewCount} reviews)</span>
            </div>
            <Separator orientation="vertical" className="hidden h-5 sm:block" />
            <p className="text-sm text-muted-foreground">{current.stockEstimate} available estimate</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{formatCurrency(current.price, current.currency)}</p>
            {current.compareAtPrice ? (
              <p className="text-muted-foreground line-through">
                {formatCurrency(current.compareAtPrice, current.currency)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              disabled={current.stockStatus === "out_of_stock" || addToCart.isPending}
              onClick={() => addToCart.mutate({ productId: current.id, variantId: variant?.id, quantity: 1 })}
            >
              <ShoppingCart className="size-4" />
              Add to cart
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/checkout">Checkout</Link>
            </Button>
          </div>
          <div className="flex gap-2 rounded-lg border bg-secondary/50 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Cart totals and availability are display estimates until the backend confirms checkout.
          </div>
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="leading-7 text-muted-foreground">
              {current.description}
            </TabsContent>
            <TabsContent value="shipping" className="leading-7 text-muted-foreground">
              Shipping options are quoted during backend checkout review.
            </TabsContent>
            <TabsContent value="shop" className="leading-7 text-muted-foreground">
              Sold by {current.shopName}. Shop-owned data remains scoped by shop context.
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
