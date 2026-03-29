import type { UserRole } from "@/lib/types";

export const SESSION_COOKIE_NAME = "__session";
export const ROLE_COOKIE_NAME = "uzazi-role";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

const MOTHER_ROUTES = ["/dashboard", "/checkin", "/companion", "/garden"];
const CHW_ROUTES = ["/triage", "/mothers", "/visit"];
const PUBLIC_ROUTES = ["/", "/login", "/register"];

export function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname);
}

export function getDefaultRouteForRole(role: UserRole | null | undefined) {
  if (role === "chw" || role === "admin") {
    return "/triage";
  }

  return "/dashboard";
}

export function getRequiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith("/mother/")) {
    return "mother";
  }

  if (pathname.startsWith("/chw/")) {
    return "chw";
  }

  if (MOTHER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return "mother";
  }

  if (CHW_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return "chw";
  }

  return null;
}
