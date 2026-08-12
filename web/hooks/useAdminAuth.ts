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

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      login: (user, accessToken, refreshToken) =>
        set({ user, token: accessToken, refreshToken, hydrated: true }),
      logout: () =>
        set({ user: null, token: null, refreshToken: null, hydrated: true }),
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
