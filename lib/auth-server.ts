import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

import { ROLE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

export { ROLE_COOKIE_NAME, SESSION_COOKIE_NAME };

const secureTokenJwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

function getSessionSecret() {
  const secret =
    process.env.UZAZI_SESSION_SECRET ??
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "uzazi-dev-session-secret";

  return new TextEncoder().encode(secret);
}

export async function signRoleToken(role: UserRole) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5d")
    .sign(getSessionSecret());
}

export async function verifyRoleToken(token: string): Promise<UserRole | null> {
  try {
    const { payload } = await jwtVerify<{ role?: UserRole }>(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    return payload.role ?? null;
  } catch {
    return null;
  }
}

export async function verifySessionCookie(token: string, projectId: string) {
  try {
    const { payload } = await jwtVerify(token, secureTokenJwks, {
      issuer: [
        `https://securetoken.google.com/${projectId}`,
        `https://session.firebase.google.com/${projectId}`,
      ],
      audience: projectId,
    });

    return payload;
  } catch {
    return null;
  }
}
