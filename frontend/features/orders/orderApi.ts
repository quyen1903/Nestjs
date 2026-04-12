import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from '@/lib/baseQuery';
import {
  ApiResponse,
  Order,
  CheckoutRequest,
  PaymentIntent,
  PaginatedResponse,
} from '@/types';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Orders', 'OrderDetail'],
  endpoints: (builder) => ({
    // Get user's orders
    getOrders: builder.query<
      ApiResponse<PaginatedResponse<Order>>,
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 20, status }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        return `/orders?${params.toString()}`;
      },
      providesTags: ['Orders'],
    }),

    // Get single order
    getOrderById: builder.query<ApiResponse<Order>, string>({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: (result, error, id) => [{ type: 'OrderDetail', id }],
    }),

    // Create payment intent for checkout
    createPaymentIntent: builder.mutation<
      ApiResponse<PaymentIntent>,
      CheckoutRequest
    >({
      query: (data) => ({
        url: '/checkout/payment-intent',
        method: 'POST',
        body: data,
      }),
    }),

    // Confirm order after payment
    confirmOrder: builder.mutation<
      ApiResponse<Order>,
      {
        paymentIntentId: string;
        checkoutData: CheckoutRequest;
      }
    >({
      query: (data) => ({
        url: '/checkout/confirm',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Orders'],
    }),

    // Create order (COD - Cash on Delivery)
    createOrder: builder.mutation<ApiResponse<Order>, CheckoutRequest>({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Orders'],
    }),

    // Update order status (admin/shop only)
    updateOrderStatus: builder.mutation<
      ApiResponse<Order>,
      { orderId: string; status: string }
    >({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'OrderDetail', id: orderId },
        'Orders',
      ],
    }),

    // Cancel order
    cancelOrder: builder.mutation<ApiResponse<Order>, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [
        { type: 'OrderDetail', id: orderId },
        'Orders',
      ],
    }),

    // Refund order
    refundOrder: builder.mutation<
      ApiResponse<Order>,
      { orderId: string; reason?: string }
    >({
      query: ({ orderId, reason }) => ({
        url: `/orders/${orderId}/refund`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'OrderDetail', id: orderId },
        'Orders',
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreatePaymentIntentMutation,
  useConfirmOrderMutation,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useRefundOrderMutation,
} = orderApi;
