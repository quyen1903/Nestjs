"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAddCartItem } from "@/features/cart/api/cart.queries";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/domain";

export function ProductCard({ product }: { product: Product }) {
  const { session } = useAuth();
  const addToCart = useAddCartItem(session);
  const variant = product.variants[0];

  return (
    <article className="group overflow-hidden rounded-lg border bg-card shadow-soft-sm transition hover:-translate-y-0.5 hover:shadow-soft-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant={tag === "Low stock" ? "outline" : "secondary"}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">{product.brand}</p>
            <Link href={`/products/${product.slug}`} className="mt-1 line-clamp-2 font-semibold hover:underline">
              {product.name}
            </Link>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-accent text-accent" />
            {product.rating.toFixed(1)}
          </div>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{product.intro}</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{formatCurrency(product.price, product.currency)}</p>
            {product.compareAtPrice ? (
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </p>
            ) : null}
          </div>
          <Button
            size="icon"
            aria-label={`Add ${product.name} to cart`}
            disabled={product.stockStatus === "out_of_stock" || addToCart.isPending}
            onClick={() =>
              addToCart.mutate({
                productId: product.id,
                variantId: variant?.id,
                quantity: 1
              })
            }
          >
            <ShoppingCart className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
