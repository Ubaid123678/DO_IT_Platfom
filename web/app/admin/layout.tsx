import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Do It Admin",
  description: "Do It platform admin dashboard",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
