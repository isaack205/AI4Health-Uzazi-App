"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, LayoutDashboard, Leaf, MessagesSquare, ShieldPlus, Users, ClipboardCheck, History, User, Home, Heart, Clock, Calendar as CalendarIcon } from "lucide-react";
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
    { href: "/checkin", label: "chat_tab", icon: Heart, isCheckin: true },
    { href: "/appointments", label: "appointment_tab", icon: CalendarIcon },
    { href: "/history", label: "health_tab", icon: History },
    { href: "/companion", label: "companion_tab", icon: MessagesSquare },
    { href: "/garden", label: "resources_tab", icon: Leaf },
    { href: "/profile", label: "settings_tab", icon: User },
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
        const lastDate = snap.docs[0].data().timestamp?.split("T")[0];
        setHasCheckedInToday(lastDate === today);
      } else {
        setHasCheckedInToday(false);
      }
    }
    checkToday();
  }, [user, role, pathname]);

  return (
    <div className="min-h-screen bg-hero-glow pb-20 lg:pb-0">
      <div className="container py-6 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar for Desktop */}
          <aside className="hidden lg:block card-soft h-fit rounded-[32px] border border-white/80 bg-white/80 p-5 backdrop-blur">
            <Link href={role === "mother" ? "/dashboard" : "/triage"} className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-uzazi-rose text-white">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-display text-2xl text-uzazi-earth">UZAZI</p>
                <p className="text-sm text-uzazi-earth/60">
                  {role === "mother" ? "Mother Journey" : "CHW Command"}
                </p>
              </div>
            </Link>

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

            <Button variant="outline" className="mt-6 w-full" onClick={() => void signOut()}>
              Sign out
            </Button>
          </aside>

          <main className="space-y-6">{children}</main>
        </div>
      </div>

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
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative",
                isActive ? "text-uzazi-rose" : "text-uzazi-earth/40"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-current opacity-20 absolute scale-150")} />
              <Icon className="h-6 w-6 relative z-10" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{role === "mother" ? t(item.label) : item.label}</span>
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
