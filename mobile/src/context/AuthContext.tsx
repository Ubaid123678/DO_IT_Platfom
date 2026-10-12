import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authService } from '@/src/services/authService';
import { api, setRefreshTokenFn } from '@/src/services/api';

// Everything that must be wiped together on logout/register. Includes the
// cached profile, the provider verification-complete sentinel, and per-user
// banner flags so a new account can never inherit the previous user's data or
// skip onboarding. `hasSeenOnboarding` is device-level and stays.
// NOTE: pendingAuthEmail/password are transient login state, deliberately NOT
// here — the login screen sets then clears them mid-flow.
export const AUTH_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'role',
  'user',
  'clientProfile',
  '@doit_verification_complete',
  '@home_verif_banner_dismissed',
  '@home_verif_banner_show_count',
];

// Clear the session from anywhere (profile screens etc.) without needing the
// AuthContext. Keeps the "what counts as session" list in one place.
export const clearStoredSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove([...AUTH_STORAGE_KEYS, 'pendingAuthEmail', 'pendingAuthPassword']);
  delete api.defaults.headers.common['Authorization'];
};

type UserRole = 'pending' | 'client' | 'provider' | 'admin';

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clears session state and returns to login. Used when the session is dead
  // (no/expired refresh token, or refresh rejected) so authed screens can't sit
  // on a dead token spamming 401s. Ref guards against repeated redirects when
  // several requests 401 at once.
  const redirectingRef = useRef(false);
  const clearSessionToLogin = React.useCallback(async () => {
    await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    if (!redirectingRef.current) {
      redirectingRef.current = true;
      try {
        router.replace('/(auth)/login');
      } finally {
        setTimeout(() => { redirectingRef.current = false; }, 1000);
      }
    }
  }, []);

  // Initialize auth state from AsyncStorage on app startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [accessToken, refreshToken, storedRole, storedUser] = await AsyncStorage.multiGet([
          'accessToken',
          'refreshToken',
          'role',
          'user',
        ]);

        const token = accessToken[1];
        const rToken = refreshToken[1];
        const storedRoleValue = storedRole[1] as UserRole | null;
        const storedUserValue = storedUser[1];

        if (token && rToken && storedRoleValue) {
          // Set the Authorization header on the API instance
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          let userData: AuthUser | null = null;
          if (storedUserValue) {
            try {
              userData = JSON.parse(storedUserValue);
            } catch {
              // Ignore parse error
            }
          }

          setIsAuthenticated(true);
          setRole(storedRoleValue);
          setUser(userData);
        } else {
          // Clear any stale data
          await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
          api.defaults.headers.common['Authorization'] = '';
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Register the refresh token function with the API interceptor
    setRefreshTokenFn(refreshAccessToken);
    initAuth();
  }, []);

  const login = (user: AuthUser, accessToken: string, refreshToken: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setIsAuthenticated(true);
    setUser(user);
    setRole(user.role);
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch {
          // Ignore logout API errors
        }
      }
    } catch {
      // Ignore errors
    } finally {
      await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
      delete api.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        await clearSessionToLogin();
        return null;
      }

      const response = await authService.refreshToken(refreshToken);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

      await AsyncStorage.multiSet([
        ['accessToken', newAccessToken],
        ['refreshToken', newRefreshToken],
      ]);

      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearSessionToLogin();
      return null;
    }
  };

  const value = {
    isAuthenticated,
    user,
    role,
    login,
    logout,
    refreshAccessToken,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};