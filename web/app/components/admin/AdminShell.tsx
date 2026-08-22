"use client";

import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "./AdminAuthGuard";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    // /admin/login renders standalone (no sidebar/topbar) so unauthenticated
    // admins see only the login card.
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-bg">
        <AdminSidebar />
        <AdminTopbar />
        <main className="ml-[240px] pt-16">
          <div className="mx-auto w-full max-w-[1280px] px-8 py-6">{children}</div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
