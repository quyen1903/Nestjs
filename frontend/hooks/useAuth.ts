'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState, AppDispatch } from '@/lib/store';
import { 
  setAuthData, 
  clearAuth, 
  initializeAuth,
  setError,
  setLoading,
} from '@/features/auth/authSlice';
import { useLoginMutation, useLogoutMutation } from '@/features/auth/authApi';
import { LoginRequest, AuthResponse, DecodedToken } from '@/types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation();

  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const handleLogin = useCallback(
    async (credentials: LoginRequest) => {
      try {
        dispatch(setLoading(true));
        const response = await login(credentials).unwrap();
        const authData = response.metadata;

        // Decode token to get user info
        const decodedToken = decodeJWT(authData.accessToken);

        dispatch(
          setAuthData({
            token: authData.accessToken,
            refreshToken: authData.refreshToken,
            user: authData.profile || {
              id: decodedToken.accountId,
              email: decodedToken.email,
            },
            decodedToken,
            userType: decodedToken.userType,
          })
        );

        dispatch(setLoading(false));
        return response;
      } catch (error: any) {
        const errorMsg = error?.data?.message || 'Login failed';
        dispatch(setError(errorMsg));
        dispatch(setLoading(false));
        throw error;
      }
    },
    [login, dispatch]
  );

  const handleLogout = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      await logout().unwrap();
      dispatch(clearAuth());
      dispatch(setLoading(false));
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      dispatch(clearAuth());
      dispatch(setLoading(false));
      router.push('/login');
    }
  }, [logout, dispatch, router]);

  return {
    ...auth,
    login: handleLogin,
    logout: handleLogout,
    isLoginLoading,
    isLogoutLoading,
  };
};

// Decode JWT token
export const decodeJWT = (token: string): DecodedToken => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Guard for protected routes
export const useProtectedRoute = (requiredUserType?: string) => {
  const router = useRouter();
  const { isAuthenticated, userType, token } = useAuth();

  useEffect(() => {
    if (!token || !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredUserType && userType !== requiredUserType) {
      router.push('/');
    }
  }, [isAuthenticated, token, userType, requiredUserType, router]);

  return { isAuthenticated, userType };
};

// Check if user is authenticated
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};
