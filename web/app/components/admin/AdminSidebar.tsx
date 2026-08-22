"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, ClipboardCheck, LogOut } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/kyc", label: "KYC Review", icon: ShieldCheck },
  { href: "/admin/verification", label: "Verification", icon: ClipboardCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col bg-sidebar-bg">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-active text-white">
          <span className="text-sm font-bold">D</span>
        </span>
        <span className="text-[15px] font-semibold text-sidebar-text">Do It Admin</span>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-colors ${
                active
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-text hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-sidebar-text transition-colors hover:bg-sidebar-bg hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}