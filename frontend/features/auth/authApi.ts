import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from '@/lib/baseQuery';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AccountProfile,
} from '@/types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    register: builder.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    getProfile: builder.query<ApiResponse<AccountProfile>, void>({
      query: () => '/auth/profile',
      providesTags: ['Auth'],
    }),

    updateProfile: builder.mutation<ApiResponse<AccountProfile>, Partial<AccountProfile>>({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),

    refreshToken: builder.mutation<ApiResponse<{ accessToken: string }>, void>({
      query: () => ({
        url: '/auth/handlerRefreshToken',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useRefreshTokenMutation,
} = authApi;
