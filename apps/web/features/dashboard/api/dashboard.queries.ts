"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMerchantProduct,
  getDashboardSummary,
  getMerchantSettings,
  getRevenueSeries,
  listMerchantCustomers,
  listMerchantInventory,
  listMerchantOrders,
  listMerchantProducts,
  updateMerchantProduct,
  updateMerchantSettings,
  type ProductMutationInput
} from "@/api/dashboard.client";
import { queryKeys } from "@/api/query-keys";
import type { MerchantSettings, TenantContext } from "@/types/domain";

export function useDashboardSummary(context: TenantContext) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(context.organizationId),
    queryFn: () => getDashboardSummary(context)
  });
}

export function useRevenueSeries(context: TenantContext) {
  return useQuery({
    queryKey: queryKeys.revenue(context.organizationId),
    queryFn: () => getRevenueSeries(context)
  });
}

export function useMerchantProducts(context: TenantContext) {
  return useQuery({
    queryKey: queryKeys.merchantProducts(context.organizationId),
    queryFn: () => listMerchantProducts(context)
  });
}

export function useMerchantOrders(context: TenantContext) {
  return useQuery({
    queryKey: queryKeys.merchantOrders(context.organizationId),
    queryFn: () => listMerchantOrders(context)
  });
}

export function useMerchantCustomers(context: TenantContext) {
  return useQuery({
    queryKey: queryKeys.merchantCustomers(context.organizationId),
    queryFn: () => listMerchantCustomers(context)
  });
}

export function useMerchantInventory(context: TenantContext) {
  return useQuery({
    queryKey: queryKeys.merchantInventory(context.organizationId),
    queryFn: () => listMerchantInventory(context)
  });
}

export function useMerchantSettings(context: TenantContext) {
  return useQuery({
    queryKey: queryKeys.merchantSettings(context.organizationId),
    queryFn: () => getMerchantSettings(context)
  });
}

export function useCreateMerchantProduct(context: TenantContext) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductMutationInput) => createMerchantProduct(context, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchantProducts(context.organizationId) });
    }
  });
}

export function useUpdateMerchantProduct(context: TenantContext, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductMutationInput) => updateMerchantProduct(context, productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchantProducts(context.organizationId) });
    }
  });
}

export function useUpdateMerchantSettings(context: TenantContext) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MerchantSettings) => updateMerchantSettings(context, input),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.merchantSettings(context.organizationId), settings);
    }
  });
}
