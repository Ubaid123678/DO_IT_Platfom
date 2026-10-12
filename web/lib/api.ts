import {
  getAdminTokenFromCookie,
  useAdminAuthStore,
} from "@/hooks/useAdminAuth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  token?: string;
  skipAuth?: boolean;
  skipUnauthorizedRedirect?: boolean;
  signal?: AbortSignal;
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
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const token = options.skipAuth
    ? undefined
    : options.token ??
      useAdminAuthStore.getState().token ??
      getAdminTokenFromCookie() ??
      undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const data = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    meta?: { message?: string };
    error?: ApiError;
    request_id?: string;
  } | null;

  if (!response.ok || !data?.success) {
    if (
      response.status === 401 &&
      !options.skipAuth &&
      !options.skipUnauthorizedRedirect
    ) {
      useAdminAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.replace("/admin/login");
      }
    }

    throw new ApiRequestError(
      data?.error?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.error?.code,
      data?.request_id,
    );
  }

  return data.data as T;
};
