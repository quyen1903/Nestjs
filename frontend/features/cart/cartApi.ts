import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from '@/lib/baseQuery';
import { ApiResponse, Cart, CartItem } from '@/types';

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Cart'],
  endpoints: (builder) => ({
    // Get current user's cart
    getCart: builder.query<ApiResponse<Cart>, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),

    // Add item to cart
    addToCart: builder.mutation<
      ApiResponse<Cart>,
      { productId: string; quantity: number }
    >({
      query: (data) => ({
        url: '/cart/add',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),

    // Update cart item quantity
    updateCartItem: builder.mutation<
      ApiResponse<Cart>,
      { cartItemId: string; quantity: number }
    >({
      query: ({ cartItemId, quantity }) => ({
        url: `/cart/item/${cartItemId}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    // Remove item from cart
    removeFromCart: builder.mutation<ApiResponse<Cart>, string>({
      query: (cartItemId) => ({
        url: `/cart/item/${cartItemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    // Clear entire cart
    clearCart: builder.mutation<ApiResponse<Cart>, void>({
      query: () => ({
        url: '/cart/clear',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    // Apply discount code to cart
    applyDiscount: builder.mutation<
      ApiResponse<Cart>,
      { discountCode: string }
    >({
      query: (data) => ({
        url: '/cart/discount',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),

    // Remove discount from cart
    removeDiscount: builder.mutation<ApiResponse<Cart>, void>({
      query: () => ({
        url: '/cart/discount',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useApplyDiscountMutation,
  useRemoveDiscountMutation,
} = cartApi;
