"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AdminAuthState {
  token: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  login: (user: AdminUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const ADMIN_TOKEN_COOKIE = "admin_token";

const getTokenExpiry = (token: string): number => {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Access token is not a valid JWT.");

  let claims: { exp?: unknown };
  try {
    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    claims = JSON.parse(atob(normalizedPayload)) as { exp?: unknown };
  } catch {
    throw new Error("Access token does not have a valid expiry.");
  }

  if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp)) {
    throw new Error("Access token does not have a valid expiry.");
  }
  return claims.exp * 1000;
};

export const isAdminTokenExpired = (token: string): boolean => {
  try {
    return getTokenExpiry(token) <= Date.now();
  } catch {
    return true;
  }
};

export const getAdminTokenFromCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${ADMIN_TOKEN_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(ADMIN_TOKEN_COOKIE.length + 1)) : null;
};

const writeAdminTokenCookie = (token: string): void => {
  if (typeof document === "undefined") return;
  const expiresAt = getTokenExpiry(token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Expires=${new Date(expiresAt).toUTCString()}; SameSite=Lax${secure}`;
};

const clearAdminTokenCookie = (): void => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      login: (user, accessToken, refreshToken) => {
        writeAdminTokenCookie(accessToken);
        set({ user, token: accessToken, refreshToken, hydrated: true });
      },
      logout: () => {
        clearAdminTokenCookie();
        set({ user: null, token: null, refreshToken: null, hydrated: true });
      },
    }),
    {
      name: "doit-admin-auth",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function useAdminAuth() {
  return useAdminAuthStore();
}
