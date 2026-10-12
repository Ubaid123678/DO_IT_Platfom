"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import type { AdminDashboardStats } from "@/types/admin";

interface AdminDashboardStatsState {
  data: AdminDashboardStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const AdminDashboardStatsContext =
  createContext<AdminDashboardStatsState | null>(null);

export function AdminDashboardStatsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const stats = useAdminQuery<AdminDashboardStats>("/admin/dashboard/stats");

  useEffect(() => {
    const intervalId = window.setInterval(stats.refetch, 60_000);
    return () => window.clearInterval(intervalId);
  }, [stats.refetch]);

  return (
    <AdminDashboardStatsContext.Provider value={stats}>
      {children}
    </AdminDashboardStatsContext.Provider>
  );
}

export function useAdminDashboardStats(): AdminDashboardStatsState {
  const context = useContext(AdminDashboardStatsContext);
  if (!context) {
    throw new Error(
      "useAdminDashboardStats must be used within AdminDashboardStatsProvider",
    );
  }
  return context;
}
