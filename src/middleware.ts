import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/admin"],
  DEAN: ["/dean"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student", "/tests", "/listening", "/reading", "/writing"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth") || pathname === "/api/users/template" || pathname === "/api/upload") {
    return NextResponse.next();
  }

  // Must be logged in for everything else
  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = req.auth.user.role;

  // Root redirect based on role
  if (pathname === "/") {
    const dashboardMap: Record<string, string> = {
      ADMIN: "/admin/dashboard",
      DEAN: "/dean/dashboard",
      TEACHER: "/teacher/dashboard",
      STUDENT: "/student/listening",
    };
    return NextResponse.redirect(new URL(dashboardMap[role] || "/login", req.url));
  }

  // Check route access by role
  const allowedPrefixes = roleRoutes[role] || [];
  const isApiRoute = pathname.startsWith("/api/");

  if (!isApiRoute) {
    const hasAccess = allowedPrefixes.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|captures|api/upload).*)"],
};
