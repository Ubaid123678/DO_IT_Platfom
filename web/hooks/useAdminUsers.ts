"use client";

import { useCallback } from "react";
import { useAdminApi } from "./useAdminApi";
import {
  USE_MOCK_USERS,
  mockFetchUsers,
  mockFetchUserDetail,
  mockUpdateUser,
  type AdminUserDetail,
  type UsersListParams,
  type UsersResponse,
  type UserRole,
} from "@/lib/users";

export function useAdminUsers() {
  const { call } = useAdminApi();

  const fetchUsers = useCallback(
    (params: UsersListParams): Promise<UsersResponse> => {
      if (USE_MOCK_USERS) return mockFetchUsers(params);
      const query = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      });
      if (params.search) query.set("search", params.search);
      if (params.role && params.role !== "all") query.set("role", params.role);
      if (params.kyc_status && params.kyc_status !== "all") query.set("kyc_status", params.kyc_status);
      if (params.overall_status && params.overall_status !== "all") {
        query.set("overall_status", params.overall_status);
      }
      return call<UsersResponse>(`/admin/users?${query.toString()}`);
    },
    [call],
  );

  const fetchUserDetail = useCallback(
    (id: string): Promise<AdminUserDetail> => {
      if (USE_MOCK_USERS) return mockFetchUserDetail(id);
      return call<AdminUserDetail>(`/admin/users/${id}`);
    },
    [call],
  );

  const updateUser = useCallback(
    (
      id: string,
      patch: { role?: UserRole; isBanned?: boolean; banReason?: string | null },
    ): Promise<AdminUserDetail> => {
      if (USE_MOCK_USERS) return mockUpdateUser(id, patch);
      return call<AdminUserDetail>(`/admin/users/${id}`, { method: "PATCH", body: { ...patch } });
    },
    [call],
  );

  return { fetchUsers, fetchUserDetail, updateUser };
}
