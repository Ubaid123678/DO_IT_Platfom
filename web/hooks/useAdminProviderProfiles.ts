"use client";

import { useCallback } from "react";
import { useAdminApi } from "./useAdminApi";
import type { ProviderProfileResponse } from "@/lib/profiles";

export function useAdminProviderProfiles() {
  const { call } = useAdminApi();

  const fetchProviderProfile = useCallback(
    (providerId: string): Promise<ProviderProfileResponse> => {
      return call<ProviderProfileResponse>(
        `/providers/admin/profiles/${encodeURIComponent(providerId)}`,
      );
    },
    [call],
  );

  return { fetchProviderProfile };
}
