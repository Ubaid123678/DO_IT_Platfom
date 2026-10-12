import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAdminToken = Boolean(request.cookies.get("admin_token")?.value);

  if (pathname === "/admin/login" && hasAdminToken) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !hasAdminToken
  ) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
