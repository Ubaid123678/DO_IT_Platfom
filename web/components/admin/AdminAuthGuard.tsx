"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { token, hydrated } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/admin/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[13px] text-text-hint">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
