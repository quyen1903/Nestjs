import {
  fetchBaseQuery,
  FetchBaseQueryError,
  BaseQueryFn,
} from '@reduxjs/toolkit/query/react';
import { RootState } from './store';
import { updateToken } from '@/features/auth/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3056/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    headers.set('Content-Type', 'application/json');

    return headers;
  },
});

// This wrapper handles token refresh on 401
const baseQueryWithReauth: BaseQueryFn<
  any,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 - token expired, try to refresh
  if (result.error && result.error.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/handlerRefreshToken',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const { accessToken } = refreshResult.data as any;
        // Dispatch action to update token
        api.dispatch(updateToken(accessToken));

        // Retry original request with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout user
        // This should be handled by middleware or in the component
      }
    }
  }

  return result;
};

export default baseQueryWithReauth;
