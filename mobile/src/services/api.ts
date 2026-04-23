import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

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

  if (!hostUri) {
    return undefined;
  }

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return undefined;
  }

  return host;
};

const resolveApiBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) {
    return toApiBaseUrl(fromEnv);
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:8080/api/v1`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api/v1';
  }

  return 'http://localhost:8080/api/v1';
};

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
