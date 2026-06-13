"use client";

import { useQuery } from "@tanstack/react-query";

import { listCategories, listProducts, listProductsByCategory, getProductBySlug } from "@/api/catalog.client";
import { queryKeys } from "@/api/query-keys";
import type { ProductFilters } from "@/types/domain";

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => listProducts(filters)
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => getProductBySlug(slug)
  });
}

export function useCategoryProducts(slug: string, filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.categoryProducts(slug, filters),
    queryFn: () => listProductsByCategory(slug, filters)
  });
}
