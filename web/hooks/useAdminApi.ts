"use client";

import { apiRequest, ApiRequestError, type RequestOptions } from "@/lib/api";
import { useAdminAuth, type AdminUser } from "./useAdminAuth";

interface RefreshResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export function useAdminApi() {
  const { token, refreshToken, user, login, logout } = useAdminAuth();

  const refresh = async (): Promise<string> => {
    if (!refreshToken) throw new ApiRequestError("No refresh token", 401);
    const data = await apiRequest<RefreshResponse>("/auth/refresh-token", {
      method: "POST",
      body: { refreshToken },
    });
    login(data.user, data.accessToken, data.refreshToken);
    return data.accessToken;
  };

  const call = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const attempt = (tok?: string) =>
      apiRequest<T>(path, { ...options, token: tok ?? options.token ?? token ?? undefined });

    try {
      return await attempt();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401 && (token || options.token)) {
        try {
          const newToken = await refresh();
          return await attempt(newToken);
        } catch {
          logout();
          if (typeof window !== "undefined") {
            window.location.href = "/admin/login";
          }
          throw err;
        }
      }
      throw err;
    }
  };

  return { call, token, user, logout };
}
