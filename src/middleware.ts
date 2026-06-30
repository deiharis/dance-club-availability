import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Redirect root to appropriate page
  if (pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  // Protect dashboard routes — admin only
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/members") || pathname.startsWith("/search") || pathname.startsWith("/analytics") || pathname.startsWith("/timetable")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }
  }

  // Protect profile routes — must be logged in
  if (pathname.startsWith("/profile")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/members/:path*", "/timetable/:path*", "/search/:path*", "/analytics/:path*", "/profile/:path*"],
};