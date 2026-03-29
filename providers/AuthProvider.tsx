"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

import {
  ensureLocalAuthPersistence,
  ensureUserProfile,
  finishGoogleRedirectFlow,
  hydrateAuthenticatedUser,
} from "@/components/auth/auth-utils";
import {
  getDefaultRouteForRole,
  getRequiredRole,
  isPublicPath,
} from "@/lib/auth";
import { auth } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  role: UserRole | null;
  signIn: (email: string, password: string, returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let authUnsubscribe: () => void = () => {};
    let tokenUnsubscribe: () => void = () => {};

    const initialize = async () => {
      try {
        await ensureLocalAuthPersistence();
        await finishGoogleRedirectFlow();
      } catch {
        // Auth state listeners below still handle the active session path.
      }

      authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!active) {
          return;
        }

        if (!firebaseUser) {
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        const profile = await ensureUserProfile(firebaseUser);

        if (!active) {
          return;
        }

        setUser(profile);
        setRole(profile.role);
        setLoading(false);
      });

      tokenUnsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          return;
        }

        const profile = await hydrateAuthenticatedUser(firebaseUser);

        if (!active) {
          return;
        }

        setRole(profile.role);
      });
    };

    void initialize();

    return () => {
      active = false;
      authUnsubscribe();
      tokenUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      if (!isPublicPath(pathname)) {
        const returnTo = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
        startTransition(() => {
          router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        });
      }

      return;
    }

    const requiredRole = getRequiredRole(pathname);
    const defaultRoute = getDefaultRouteForRole(user.role);
    const isEntryRoute = pathname === "/" || pathname === "/login" || pathname === "/register";

    if (isEntryRoute) {
      startTransition(() => {
        router.replace(defaultRoute);
      });

      return;
    }

    if (requiredRole && requiredRole !== user.role) {
      startTransition(() => {
        router.replace(defaultRoute);
      });
    }
  }, [loading, pathname, router, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      role,
      async signIn(email, password, returnTo) {
        await ensureLocalAuthPersistence();
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await hydrateAuthenticatedUser(credential.user);

        setUser(profile);
        setRole(profile.role);

        const requiredRole = returnTo ? getRequiredRole(returnTo) : null;
        const destination =
          returnTo && (!requiredRole || requiredRole === profile.role)
            ? returnTo
            : getDefaultRouteForRole(profile.role);

        startTransition(() => {
          router.replace(destination);
        });
      },
      async signOut() {
        await fetch("/api/session", { method: "DELETE" });
        await firebaseSignOut(auth);
        setUser(null);
        setRole(null);

        startTransition(() => {
          router.replace("/login");
        });
      },
    }),
    [loading, role, router, user],
  );

  if (loading && !isPublicPath(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-uzazi-cream px-6">
        <div className="card-soft flex w-full max-w-sm flex-col items-center gap-3 p-8 text-center">
          <div className="h-3 w-3 animate-pulse rounded-full bg-uzazi-rose" />
          <p className="text-display text-2xl text-uzazi-earth">Preparing your care space</p>
          <p className="text-sm text-uzazi-earth/70">
            UZAZI is checking your session and loading the right dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
