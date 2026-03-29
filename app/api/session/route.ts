import { NextResponse } from "next/server";

import { ROLE_COOKIE_NAME, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { signRoleToken } from "@/lib/auth-server";
import type { UserRole } from "@/lib/types";

interface SessionRequest {
  token?: string;
  role?: UserRole;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SessionRequest;

  if (!body.token || !body.role) {
    return NextResponse.json({ error: "A Firebase token and role are required." }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  const roleToken = await signRoleToken(body.role);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(SESSION_COOKIE_NAME, body.token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  response.cookies.set(ROLE_COOKIE_NAME, roleToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(ROLE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
