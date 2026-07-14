"use client";

import Link from "next/link";
import { BarChart3, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function MarketingNavbar() {
  const { session } = useAuth();
  const accountHref =
    session?.role === "SHOP" || session?.role === "ADMIN" ? "/dashboard" : "/account";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            QC
          </span>
          <span>QuyenCommerce</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link className="hover:text-foreground" href="/products">
            Products
          </Link>
          <Link className="hover:text-foreground" href="/categories/workspace">
            Categories
          </Link>
          <Link className="hover:text-foreground" href="/dashboard">
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={session ? accountHref : "/login"}>
              {session ? (session.role === "USER" ? "Account" : "Dashboard") : "Login"}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cart">
              <ShoppingBag className="size-4" />
              Cart
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="hidden md:inline-flex" aria-label="Open dashboard">
            <Link href="/dashboard">
              <BarChart3 className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
