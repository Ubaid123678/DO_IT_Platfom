"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/kyc": "KYC Review",
  "/admin/verification": "Verification Review",
};

const titleForPath = (pathname: string) => {
  const exact = routeTitles[pathname];
  if (exact) return exact;
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/kyc")) return "KYC Review";
  if (pathname.startsWith("/admin/verification")) return "Verification Review";
  return "Admin";
};

export function AdminTopbar({ title }: { title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const initials = (user?.fullName ?? "A")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-20 ml-[240px] flex h-16 items-center justify-between border-b border-border bg-surface px-8">
      <h1 className="text-[18px] font-semibold text-text-primary">
        {title ?? titleForPath(pathname)}
      </h1>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-[13px] font-semibold text-primary-dark">
            {initials}
          </span>
          <span className="hidden text-[13px] font-medium text-text-primary sm:block">
            {user?.fullName ?? "Admin"}
          </span>
          <ChevronDown className="h-4 w-4 text-text-hint" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-secondary transition-colors hover:bg-bg"
            >
              <UserRound className="h-4 w-4" />
              Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-error transition-colors hover:bg-bg"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}