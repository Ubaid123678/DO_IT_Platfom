"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isAdminTokenExpired, useAdminAuth } from "@/hooks/useAdminAuth";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user, hydrated, logout } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      hydrated &&
      (!token || isAdminTokenExpired(token) || user?.role !== "admin")
    ) {
      logout();
      router.replace("/admin/login");
    }
  }, [hydrated, token, user, logout, router]);

  if (
    !hydrated ||
    !token ||
    isAdminTokenExpired(token) ||
    user?.role !== "admin"
  ) {
    return (
      <div className="admin-theme flex min-h-screen items-center justify-center bg-bg text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[13px] text-text-hint">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
