"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, type RequestOptions } from "@/lib/api";

export interface AdminQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAdminQuery<T>(
  path: string,
  options: RequestOptions = {},
  enabled = true,
): AdminQueryResult<T> {
  const [result, setResult] = useState<{
    requestKey: string;
    data: T | null;
    error: Error | null;
  } | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const optionsKey = JSON.stringify({
    method: options.method,
    body: options.body,
    token: options.token,
    skipAuth: options.skipAuth,
    skipUnauthorizedRedirect: options.skipUnauthorizedRedirect,
  });
  const stableOptions = useMemo(
    () => JSON.parse(optionsKey) as RequestOptions,
    [optionsKey],
  );
  const requestKey = `${path}:${optionsKey}:${requestVersion}`;

  const refetch = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    void apiRequest<T>(path, { ...stableOptions, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, data: result, error: null });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          requestKey,
          data: null,
          error:
            requestError instanceof Error
              ? requestError
              : new Error("Unable to load data."),
        });
      });

    return () => controller.abort();
  }, [enabled, optionsKey, path, requestKey, stableOptions]);

  const currentResult = result?.requestKey === requestKey ? result : null;
  return {
    data: currentResult?.data ?? null,
    loading: enabled && currentResult === null,
    error: currentResult?.error ?? null,
    refetch,
  };
}
