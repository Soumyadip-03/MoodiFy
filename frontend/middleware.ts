import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/home", "/history", "/profile", "/playlist", "/mood-room"];
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("firebaseToken")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/history/:path*", "/profile/:path*", "/playlist/:path*", "/mood-room/:path*", "/login", "/signup"],
};
