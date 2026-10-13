import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const toApiBaseUrl = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

const getExpoHost = (): string | undefined => {
  const manifestLike = Constants as unknown as {
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
    manifest?: { debuggerHost?: string };
  };

  const hostUri =
    Constants.expoConfig?.hostUri ?? manifestLike.manifest2?.extra?.expoClient?.hostUri ?? manifestLike.manifest?.debuggerHost;

  if (!hostUri) return undefined;

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return undefined;

  return host;
};

const resolveApiBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return toApiBaseUrl(fromEnv);

  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:8080/api/v1`;

  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api/v1';

  return 'http://localhost:8080/api/v1';
};

// Debug: log the resolved base URL
const resolvedBaseUrl = resolveApiBaseUrl();
console.log('[API] Base URL:', resolvedBaseUrl);

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

// Extract the backend's human message from an axios error so screens can show
// e.g. "Insufficient funds for escrow" instead of the generic axios text.
export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  const e = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
  const apiMessage = e?.response?.data?.error?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) return apiMessage;
  if (typeof e?.message === 'string' && e.message.trim().length > 0 && !/status code/.test(e.message)) {
    return e.message;
  }
  return fallback;
};

export const getMediaUrl = (path: string): string => {  if (!path) return path;
  if (/^(?:https?:|data:|file:)/i.test(path)) return path;
  const origin = resolveApiBaseUrl().replace(/\/api\/v1$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

const isFormData = (data: unknown): boolean =>
  typeof FormData !== 'undefined' &&
  (data instanceof FormData ||
    (data !== null && typeof data === 'object' && (data as Record<string, unknown>).constructor?.name === 'FormData'));

api.interceptors.request.use(async (config) => {
  const isRefreshRequest = config.url?.includes('/auth/refresh-token') === true;
  const hasExplicitAuthorization = Boolean(config.headers?.Authorization);
  const storedAccessToken = hasExplicitAuthorization ? null : await AsyncStorage.getItem('accessToken');
  if (storedAccessToken && !isRefreshRequest) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${storedAccessToken}`;
  }
  if (isRefreshRequest && config.headers) {
    delete config.headers.Authorization;
  }

  if (!isFormData(config.data)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

let refreshTokenFn: (() => Promise<string | null>) | null = null;

export const setRefreshTokenFn = (fn: () => Promise<string | null>) => {
  refreshTokenFn = fn;
};

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const url = originalRequest?.url ?? '';
    const isCredentialEndpoint = /\/(login|register|verify-email|verify-phone|resend-otp|forgot-password|reset-password|logout|refresh-token)(\?|$)/.test(url);
    const status = error.response?.status;
    const refreshFn = refreshTokenFn;
    // A 401/403 on a normal endpoint is recoverable by refreshing + retrying
    // once. Don't log the first (recoverable) hit as an error — only log a
    // genuine, final failure (credential error, or a failed retry).
    const willRetry = (status === 401 || status === 403) && !isCredentialEndpoint && !!refreshFn && !originalRequest?._retry;

    if (!willRetry) {
      console.error('[API Error]', {
        status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        message: error.message,
      });
    }

    if (willRetry && originalRequest && refreshFn) {
      if (isRefreshing) {
        // Wait for the ongoing refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshFn();
        if (newToken) {
          processQueue(null, newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        const refreshError = new Error('Session expired. Please sign in again.');
        processQueue(refreshError, null);
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
