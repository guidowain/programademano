import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "./lib/auth";

function withPathnameHeader(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/auth/login") {
    return withPathnameHeader(request);
  }

  const token = request.cookies.get("admin-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const payload = await verifyAdminToken(token);

  if (!payload) {
    const response = pathname.startsWith("/api/admin")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("admin-token");
    return response;
  }

  return withPathnameHeader(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
