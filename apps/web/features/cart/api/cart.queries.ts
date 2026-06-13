"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addCartItem, clearCart, getCart, updateCartItemQuantity } from "@/api/cart.client";
import { queryKeys } from "@/api/query-keys";
import type { AuthSession, Cart } from "@/types/domain";

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: getCart
  });
}

export function useAddCartItem(session: AuthSession | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; variantId?: string; quantity: number }) =>
      addCartItem({ ...input, session }),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart, cart);
    }
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => updateCartItemQuantity(id, quantity),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart });
      const previous = queryClient.getQueryData<Cart>(queryKeys.cart);
      if (previous) {
        const items =
          quantity <= 0
            ? previous.items.filter((item) => item.id !== id)
            : previous.items.map((item) => (item.id === id ? { ...item, quantity } : item));
        queryClient.setQueryData<Cart>(queryKeys.cart, { ...previous, items });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.cart, context.previous);
      }
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart, cart);
    }
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart, cart);
    }
  });
}
