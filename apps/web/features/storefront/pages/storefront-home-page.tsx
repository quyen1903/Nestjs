"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Store } from "lucide-react";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories, useProducts } from "@/features/products/api/product.queries";

export function StorefrontHomePage() {
  const products = useProducts({ limit: 8, sort: "featured" });
  const categories = useCategories();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <StorefrontHeader />
      <main>
        <section className="page-shell grid gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Backend-confirmed checkout and inventory
            </div>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
                A storefront and merchant workspace for serious commerce teams.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Browse tenant-scoped products, review estimated carts, and manage a merchant operation without moving business rules into the browser.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">
                  Browse products
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  <Store className="size-4" />
                  Merchant dashboard
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Typed API layer", "Tenant-aware dashboard", "Mock fallback isolated"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border bg-secondary">
            <Image
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82"
              alt="Modern commerce workspace"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 grid gap-3 rounded-lg border bg-background/92 p-4 shadow-soft-md backdrop-blur sm:grid-cols-3">
              <Metric label="GMV estimate" value="$42.8k" />
              <Metric label="Active shops" value="2" />
              <Metric label="Catalog items" value="9" />
            </div>
          </div>
        </section>

        <section className="page-shell py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Catalog</p>
              <h2 className="text-2xl font-semibold tracking-normal">Featured Products</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/products">View all</Link>
            </Button>
          </div>
          {products.isLoading ? <LoadingState label="Loading featured products" /> : null}
          {products.isError ? <ErrorState onRetry={() => void products.refetch()} /> : null}
          {products.data && products.data.items.length === 0 ? (
            <EmptyState title="No products yet" description="Products will appear after the backend or mock catalog returns items." />
          ) : null}
          {products.data ? <ProductGrid products={products.data.items} /> : null}
        </section>

        <section className="page-shell pb-12">
          <div className="mb-5">
            <p className="text-sm font-medium text-primary">Explore</p>
            <h2 className="text-2xl font-semibold tracking-normal">Categories</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.data?.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="mt-2 min-h-12 text-sm text-muted-foreground">{category.description}</p>
                  <Button asChild variant="link" className="mt-3">
                    <Link href={`/categories/${category.slug}`}>Open category</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
