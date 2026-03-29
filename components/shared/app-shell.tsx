"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { HeartPulse, LayoutDashboard, Leaf, LogOut, MessagesSquare, Settings, ShieldPlus, Users, History, Heart, Calendar as CalendarIcon } from "lucide-react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  isCheckin?: boolean;
}

const navigation: Record<"mother" | "chw", NavItem[]> = {
  mother: [
    { href: "/dashboard", label: "home_tab", icon: LayoutDashboard },
    { href: "/community", label: "community_tab", icon: Users },
    { href: "/checkin", label: "chat_tab", icon: Heart, isCheckin: true },
    { href: "/appointments", label: "appointment_tab", icon: CalendarIcon },
    { href: "/history", label: "health_tab", icon: History },
    { href: "/garden", label: "resources_tab", icon: Leaf },
  ],
  chw: [
    { href: "/triage", label: "Triage", icon: ShieldPlus },
    { href: "/mothers", label: "Mothers", icon: Users },
  ],
};

export function AppShell({
  role,
  children,
}: {
  role: "mother" | "chw";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { t } = useLocale();
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);

  useEffect(() => {
    async function checkToday() {
      if (role !== "mother" || !user?.uid) return;
      const today = new Date().toISOString().split("T")[0];
      const q = query(
        collection(db, "checkins"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rawTimestamp = snap.docs[0].data().timestamp;
        const lastDate =
          typeof rawTimestamp?.toDate === "function"
            ? rawTimestamp.toDate().toISOString().split("T")[0]
            : typeof rawTimestamp === "string"
              ? rawTimestamp.split("T")[0]
              : null;
        setHasCheckedInToday(lastDate === today);
      } else {
        setHasCheckedInToday(false);
      }
    }
    checkToday();
  }, [user, role, pathname]);

  return (
    <div className="min-h-screen bg-hero-glow pb-24 lg:pb-10">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between gap-4 py-4">
          <Link href={role === "mother" ? "/dashboard" : "/triage"} className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-uzazi-rose text-white shadow-bloom">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-display text-2xl leading-none text-uzazi-earth">UZAZI</p>
              <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-uzazi-earth/45">
                {role === "mother" ? "Mother Journey" : "CHW Command"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={role === "mother" ? "/profile" : role === "chw" ? "/mothers" : "/"}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-uzazi-earth/10 bg-white px-4 text-sm font-medium text-uzazi-earth transition-colors hover:bg-uzazi-petal/40"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{role === "mother" ? t("settings_tab") : "Settings"}</span>
            </Link>
            <Button
              variant="outline"
              className="h-10 rounded-full border-uzazi-earth/10 bg-white px-4"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-5 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar for Desktop */}
          <aside className="hidden lg:block card-soft sticky top-24 h-fit rounded-[32px] border border-white/80 bg-white/80 p-5 backdrop-blur">
            <div className="mt-8 rounded-[28px] bg-uzazi-petal/80 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-uzazi-earth/50">Signed in</p>
              <p className="mt-3 font-semibold text-uzazi-earth">{user?.name ?? "UZAZI Member"}</p>
              <p className="text-sm text-uzazi-earth/65">{user?.county ?? "Care Network"}</p>
            </div>

            <nav className="mt-6 space-y-2">
              {navigation[role].map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-uzazi-rose text-white shadow-bloom"
                        : "text-uzazi-earth/70 hover:bg-uzazi-petal/70 hover:text-uzazi-earth",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {role === "mother" ? t(item.label) : item.label}
                    {item.isCheckin && !hasCheckedInToday && (
                      <span className="absolute top-3 right-4 h-2 w-2 rounded-full bg-rose-500 border border-white" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-6">{children}</main>
        </div>
      </div>

      {role === "mother" && pathname !== "/companion" ? <FloatingCompanionButton onOpen={() => router.push("/companion")} /> : null}

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/90 p-3 backdrop-blur-lg border-t border-uzazi-earth/5 lg:hidden">
        {navigation[role].map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all",
                isActive ? "text-uzazi-rose" : "text-uzazi-earth/40"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-uzazi-petal text-uzazi-rose"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="max-w-full text-center text-[9px] font-bold uppercase tracking-[0.12em]">
                {role === "mother" ? t(item.label) : item.label}
              </span>
              {isActive && <div className="h-1 w-4 bg-uzazi-rose rounded-full mt-0.5" />}
              {item.isCheckin && !hasCheckedInToday && (
                <span className="absolute top-2 right-4 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function FloatingCompanionButton({ onOpen }: { onOpen: () => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setPosition({
      x: Math.max(16, window.innerWidth - 92),
      y: Math.max(120, window.innerHeight - 180),
    });
  }, []);

  const clamp = (nextX: number, nextY: number) => {
    if (typeof window === "undefined") {
      return { x: nextX, y: nextY };
    }

    return {
      x: Math.min(Math.max(12, nextX), window.innerWidth - 76),
      y: Math.min(Math.max(88, nextY), window.innerHeight - 160),
    };
  };

  return (
    <button
      type="button"
      aria-label="Open companion"
      className={cn(
        "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-uzazi-rose to-uzazi-amber text-white shadow-[0_18px_45px_rgba(209,75,117,0.35)] transition-transform",
        dragging ? "scale-105 cursor-grabbing" : "cursor-grab hover:scale-105",
      )}
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => {
        const startX = event.clientX;
        const startY = event.clientY;
        const origin = position;
        movedRef.current = false;
        setDragging(true);

        const handleMove = (moveEvent: PointerEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
            movedRef.current = true;
          }
          setPosition(clamp(origin.x + deltaX, origin.y + deltaY));
        };

        const handleUp = () => {
          window.removeEventListener("pointermove", handleMove);
          window.removeEventListener("pointerup", handleUp);
          setDragging(false);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onClick={() => {
        if (!movedRef.current) {
          onOpen();
        }
      }}
    >
      <MessagesSquare className="h-6 w-6" />
    </button>
  );
}
