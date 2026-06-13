"use client";

import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/features/cart/api/cart.queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StorefrontHeader() {
  const router = useRouter();
  const { data: cart } = useCart();
  const [query, setQuery] = useState("");
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <section className="border-b bg-secondary/40">
      <div className="page-shell flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Multi-tenant storefront</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
            Curated products from independent shops
          </h1>
        </div>
        <form
          className="flex w-full max-w-xl gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/products?query=${encodeURIComponent(query)}`);
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search catalog"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button asChild variant="outline" className="relative" aria-label="Open cart">
            <Link href="/cart">
              <ShoppingCart className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 ? (
                <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          </Button>
        </form>
      </div>
    </section>
  );
}
