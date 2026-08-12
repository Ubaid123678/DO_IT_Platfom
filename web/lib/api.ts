export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
};

export type ApiError = {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    meta?: { message?: string };
    error?: ApiError;
    request_id?: string;
  } | null;

  if (!response.ok || !data?.success) {
    throw new ApiRequestError(
      data?.error?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.error?.code,
      data?.request_id,
    );
  }

  return data.data as T;
};
