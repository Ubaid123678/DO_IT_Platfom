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

export const getMediaUrl = (path: string): string => {
  if (!path) return path;
  if (/^(?:https?:|data:|file:)/i.test(path)) return path;
  const origin = resolveApiBaseUrl().replace(/\/api\/v1$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

const isFormData = (data: unknown): boolean =>
  typeof FormData !== 'undefined' &&
  (data instanceof FormData ||
    (data !== null && typeof data === 'object' && (data as Record<string, unknown>).constructor?.name === 'FormData'));

api.interceptors.request.use((config) => {
  if (!isFormData(config.data)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Note: AuthProvider now handles token initialization and refresh.
// This interceptor is kept for request/response logging if needed.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

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

// Note: Token refresh is now handled by AuthProvider.
// This interceptor only logs errors.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log all errors for debugging
    console.error('[API Error]', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  },
);
