export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: Record<string, unknown>;
  token?: string;
};

export type ApiError = {
  code?: string;
  message: string;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = (await response.json()) as {
    success: boolean;
    data?: T;
    meta?: { message?: string };
    error?: ApiError;
  };

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || `Request failed with status ${response.status}`);
  }

  return data.data as T;
};
