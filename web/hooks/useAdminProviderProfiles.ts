"use client";

import { useCallback } from "react";
import { useAdminApi } from "./useAdminApi";
import {
  USE_MOCK_PROFILES,
  mockFetchProviderProfile,
  type ProviderProfileResponse,
} from "@/lib/profiles";

export function useAdminProviderProfiles() {
  const { call } = useAdminApi();

  const fetchProviderProfile = useCallback(
    (providerId: string): Promise<ProviderProfileResponse> => {
      if (USE_MOCK_PROFILES) return mockFetchProviderProfile(providerId);
      return call<ProviderProfileResponse>(`/providers/admin/profiles/${providerId}`);
    },
    [call],
  );

  return { fetchProviderProfile };
}
