import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccountProfile, DecodedToken } from '@/types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AccountProfile | null;
  decodedToken: DecodedToken | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  userType: 'USER' | 'SHOP' | 'ADMIN' | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  decodedToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  userType: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sync token from localStorage on app init
    initializeAuth(state) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        const decodedToken = localStorage.getItem('decodedToken');
        
        if (token && decodedToken) {
          try {
            state.token = token;
            state.decodedToken = JSON.parse(decodedToken);
            state.isAuthenticated = true;
            state.userType = state.decodedToken.userType;
          } catch (e) {
            // Invalid token
            localStorage.removeItem('accessToken');
            localStorage.removeItem('decodedToken');
          }
        }
      }
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    setAuthData(state, action: PayloadAction<{
      token: string;
      refreshToken: string;
      user: AccountProfile;
      decodedToken: DecodedToken;
      userType: 'USER' | 'SHOP' | 'ADMIN';
    }>) {
      const { token, refreshToken, user, decodedToken, userType } = action.payload;
      
      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user;
      state.decodedToken = decodedToken;
      state.isAuthenticated = true;
      state.userType = userType;
      state.error = null;

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('decodedToken', JSON.stringify(decodedToken));
      }
    },

    updateToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload);
      }
    },

    clearAuth(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.decodedToken = null;
      state.isAuthenticated = false;
      state.userType = null;
      state.error = null;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('decodedToken');
      }
    },

    updateProfile(state, action: PayloadAction<Partial<AccountProfile>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  initializeAuth,
  setLoading,
  setError,
  setAuthData,
  updateToken,
  clearAuth,
  updateProfile,
} = authSlice.actions;

export default authSlice.reducer;
