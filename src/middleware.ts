import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Change-password page: login required. Anyone on a temporary password
  // (imported, or added by a Lead/admin) is sent here from every other page.
  if (pathname.startsWith("/change-password")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }
  if (token?.mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  // Root redirect
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    // Dancers and Dance Leads land in the dancer section
    if (token.category === "DANCER") {
      return NextResponse.redirect(new URL("/dance", req.url));
    }
    if (token.role === "SUPERADMIN" || token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  // Dancer section: dancers, Dance Leads, and admins (SuperAdmin/Core)
  if (pathname.startsWith("/dance")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.category !== "DANCER" && token.role === "MEMBER") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }
  }

  // SUPERADMIN only routes
  if (
    pathname.startsWith("/grades") ||
    pathname.startsWith("/od") ||
    pathname.startsWith("/events")
  ) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin + SuperAdmin only routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/reports/review")
  ) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    // Dancers and Dance Leads have their own section; keep them out of committee pages
    if (token.category === "DANCER" && token.role !== "SUPERADMIN") {
      const to = pathname.startsWith("/reports/review") ? "/dance/reports" : "/dance";
      return NextResponse.redirect(new URL(to, req.url));
    }
    if (token.role === "MEMBER") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }
  }

  // Timetable — all authenticated users allowed
  // The page itself handles what each role sees
  if (pathname.startsWith("/timetable")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
  }

  // All logged-in users
  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/reports/submit") ||
    pathname.startsWith("/reports/mine")
  ) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/members/:path*",
    "/timetable/:path*",
    "/search/:path*",
    "/analytics/:path*",
    "/grades/:path*",
    "/od/:path*",
    "/events/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/dance/:path*",
    "/notifications/:path*",
    "/change-password",
  ],
};