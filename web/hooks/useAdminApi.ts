"use client";

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { apiRequest, ApiRequestError, type RequestOptions } from "@/lib/api";
import { useAdminAuthStore, type AdminUser } from "./useAdminAuth";

interface RefreshResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export function useAdminApi() {
  const { token, refreshToken, user, login, logout } = useAdminAuthStore(
    useShallow((state) => ({
      token: state.token,
      refreshToken: state.refreshToken,
      user: state.user,
      login: state.login,
      logout: state.logout,
    })),
  );

  const refresh = useCallback(async (): Promise<string> => {
    if (!refreshToken) throw new ApiRequestError("No refresh token", 401);
    const data = await apiRequest<RefreshResponse>("/auth/refresh-token", {
      method: "POST",
      body: { refreshToken },
    });
    login(data.user, data.accessToken, data.refreshToken);
    return data.accessToken;
  }, [login, refreshToken]);

  const call = useCallback(async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const attempt = (tok?: string) => apiRequest<T>(path, { ...options, token: tok ?? options.token ?? token ?? undefined });

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
  }, [logout, refresh, token]);

  return { call, token, user, logout };
}
