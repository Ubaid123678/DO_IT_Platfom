"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  AdminDashboardStatsProvider,
  useAdminDashboardStats,
} from "@/hooks/useAdminDashboardStats";
import { Toaster } from "@/components/ui/Toaster";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  {
    href: "/admin/kyc",
    label: "KYC Review",
    icon: ShieldCheck,
    pending: "kyc" as const,
  },
  {
    href: "/admin/verification",
    label: "Verification",
    icon: ClipboardCheck,
    pending: "verification" as const,
  },
];

function AdminDashboardShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();
  const dashboardStats = useAdminDashboardStats();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  const sidebar = (
    <>
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-white">Do It</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#CFEAE6]">
            Admin
          </p>
        </div>
      </div>
      <nav
        className="flex-1 space-y-1 px-3 py-5"
        aria-label="Admin navigation"
      >
        {navigation.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-text hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.pending && (
                <span
                  className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-bold text-[#3E2B05]"
                  aria-label={
                    item.pending === "kyc"
                      ? "Pending KYC count"
                      : "Pending verification count"
                  }
                  title="Pending count"
                >
                  {dashboardStats.data
                    ? item.pending === "kyc"
                      ? dashboardStats.data.kyc.pending
                      : dashboardStats.data.verification.pending_review
                    : "—"}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-text transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-theme min-h-screen bg-bg text-text-primary">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar-bg lg:flex">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close navigation menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="relative flex h-full w-[min(19rem,85vw)] flex-col bg-sidebar-bg shadow-2xl"
            aria-label="Mobile admin navigation"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-text-secondary hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <h1 className="text-base font-semibold text-text-primary sm:text-lg">
              {navigation.find((item) =>
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href),
              )?.label ?? "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-56 truncate text-sm font-medium text-text-secondary sm:block">
              {user?.fullName ?? "Administrator"}
            </span>
            <span
              className="flex size-9 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-dark"
              aria-hidden="true"
            >
              {(user?.fullName ?? "A")
                .split(/\s+/)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-text-secondary hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function AdminDashboardShell({ children }: { children: ReactNode }) {
  return (
    <AdminDashboardStatsProvider>
      <AdminDashboardShellContent>{children}</AdminDashboardShellContent>
    </AdminDashboardStatsProvider>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </AdminAuthGuard>
  );
}
