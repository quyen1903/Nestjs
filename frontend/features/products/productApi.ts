import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from '@/lib/baseQuery';
import { ApiResponse, Product, ProductFilter, PaginatedResponse } from '@/types';

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Products', 'ProductDetail'],
  endpoints: (builder) => ({
    // Get paginated products with filters
    getProducts: builder.query<
      ApiResponse<PaginatedResponse<Product>>,
      ProductFilter
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.brand) params.append('brand', filters.brand);
        if (filters.priceMin) params.append('priceMin', filters.priceMin.toString());
        if (filters.priceMax) params.append('priceMax', filters.priceMax.toString());
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        return `/products?${params.toString()}`;
      },
      providesTags: ['Products'],
    }),

    // Get single product by ID
    getProductById: builder.query<ApiResponse<Product>, string>({
      query: (productId) => `/products/${productId}`,
      providesTags: (result, error, id) => [{ type: 'ProductDetail', id }],
    }),

    // Get products by category
    getProductsByCategory: builder.query<
      ApiResponse<PaginatedResponse<Product>>,
      { category: string; page?: number; limit?: number }
    >({
      query: ({ category, page = 1, limit = 20 }) =>
        `/products/category/${category}?page=${page}&limit=${limit}`,
      providesTags: ['Products'],
    }),

    // Search products
    searchProducts: builder.query<
      ApiResponse<PaginatedResponse<Product>>,
      { query: string; page?: number; limit?: number }
    >({
      query: ({ query, page = 1, limit = 20 }) =>
        `/products/search?q=${query}&page=${page}&limit=${limit}`,
      providesTags: ['Products'],
    }),

    // Create product (for shop user)
    createProduct: builder.mutation<ApiResponse<Product>, Partial<Product>>({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),

    // Update product
    updateProduct: builder.mutation<
      ApiResponse<Product>,
      { id: string; data: Partial<Product> }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ProductDetail', id },
        'Products',
      ],
    }),

    // Delete product
    deleteProduct: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),

    // Publish product
    publishProduct: builder.mutation<ApiResponse<Product>, string>({
      query: (id) => ({
        url: `/products/${id}/publish`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ProductDetail', id },
        'Products',
      ],
    }),

    // Get trending products
    getTrendingProducts: builder.query<
      ApiResponse<PaginatedResponse<Product>>,
      { limit?: number }
    >({
      query: ({ limit = 20 }) => `/products/trending?limit=${limit}`,
      providesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductsByCategoryQuery,
  useSearchProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  usePublishProductMutation,
  useGetTrendingProductsQuery,
} = productApi;
