import { NextResponse, type NextRequest } from "next/server";

import {
  getDefaultRouteForRole,
  getRequiredRole,
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { verifyRoleToken, verifySessionCookie } from "@/lib/auth-server";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const requiredRole = getRequiredRole(request.nextUrl.pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!projectId || !sessionCookie) {
    return redirectToLogin(request);
  }

  const session = await verifySessionCookie(sessionCookie, projectId);

  if (!session) {
    return redirectToLogin(request);
  }

  const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  const role = roleCookie ? await verifyRoleToken(roleCookie) : null;

  if (role !== requiredRole) {
    const redirectUrl = new URL(role ? getDefaultRouteForRole(role) : "/login", request.url);

    if (!role) {
      redirectUrl.searchParams.set(
        "returnTo",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
    }

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checkin/:path*",
    "/companion/:path*",
    "/garden/:path*",
    "/triage/:path*",
    "/mothers/:path*",
    "/visit/:path*",
    "/mother/:path*",
    "/chw/:path*",
  ],
};
