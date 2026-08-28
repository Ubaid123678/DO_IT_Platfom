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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col bg-[#0D2624]">
      {/* Top: Logo + "Admin" label */}
      <div className="flex h-16 flex-col items-center justify-center gap-1 px-6 border-b border-white/10">
        <span className="text-xl font-extrabold text-white">Do It</span>
        <span className="text-[11px] font-medium text-[#CFEAE6]">Admin</span>
      </div>

      {/* Divider */}
      <div className="border-b border-white/10 mx-4" />

      {/* Nav list */}
      <nav className="mt-4 flex-1 space-y-1 px-3" aria-label="Admin navigation">
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
                  ? "bg-primary text-white"
                  : "text-[#CFEAE6] hover:bg-white/10 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: divider + Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#CFEAE6] transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log Out
        </button>
      </div>
    </aside>
  );
}