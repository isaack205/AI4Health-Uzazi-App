"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { 
  Flower2, 
  Heart, 
  Sparkles, 
  Sprout, 
  Calendar, 
  ArrowRight, 
  Activity, 
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { useAppointments } from "@/lib/hooks/use-appointments";
import { useLatestCheckIn } from "@/lib/hooks/use-checkin";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

function formatCheckinDate(value: unknown) {
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  }

  if (typeof value === "string" || value instanceof Date) {
    return new Date(value).toLocaleDateString();
  }

  return "Today";
}

export function MotherDashboardOverview() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { data: appointments = [] } = useAppointments(user?.uid);
  const { data: latestCheckIn } = useLatestCheckIn(user?.uid);
  
  const mother = user && "postpartumDay" in user ? user : null;

  const nextApt = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.find(a => a.status === "upcoming" && a.date >= today);
  }, [appointments]);

  const wellnessScore = latestCheckIn?.riskScore ? 100 - latestCheckIn.riskScore : 85;

  return (
    <div className="space-y-6">
      {/* Appointment Alert */}
      {nextApt && (
        <Link href="/appointments" className="block group">
          <div className="bg-uzazi-rose text-white px-6 py-4 rounded-[24px] flex items-center justify-between shadow-bloom transition-transform group-hover:scale-[1.01] active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-full">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">{t("appointment.next")}</p>
                <p className="font-semibold">{nextApt.title} — {new Date(nextApt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Postpartum Day"
          value={`${mother?.postpartumDay ?? 12}`}
          hint="A gentle timeline to pace your recovery."
        />
        <StatCard
          label="Garden Petals"
          value={`${mother?.gardenPetals ?? 14}`}
          hint="Each check-in and reflection grows your garden."
        />
        <StatCard
          label="Assigned CHW"
          value={mother?.assignedCHW ?? "Grace W."}
          hint="Your community support connection."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          {/* Recovery Signal - The Cool/Realistic Hackathon feature */}
          <Card className="overflow-hidden border-none shadow-soft bg-white/80 backdrop-blur-md rounded-[32px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="muted" className="bg-uzazi-petal text-uzazi-rose border-uzazi-rose/20 font-bold px-3 py-1">
                  AI Wellness Insight
                </Badge>
                <span className="text-[10px] uppercase font-bold tracking-widest text-uzazi-earth/40">Last check-in: {latestCheckIn ? formatCheckinDate(latestCheckIn.timestamp) : 'Today'}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="flex items-center gap-6 p-4 rounded-[28px] bg-uzazi-cream/50 border border-uzazi-petal/30">
                <div className="relative flex items-center justify-center h-24 w-24 flex-shrink-0">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-uzazi-petal"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * wellnessScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className={cn(
                        "transition-all duration-1000",
                        wellnessScore > 70 ? "text-uzazi-leaf" : wellnessScore > 40 ? "text-uzazi-amber" : "text-uzazi-rose"
                      )}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-uzazi-earth">{wellnessScore}%</span>
                    <span className="text-[8px] uppercase font-bold text-uzazi-earth/40">Wellness</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-uzazi-earth leading-tight">
                    {wellnessScore > 70 ? "Your signals are radiating strength." : wellnessScore > 40 ? "Steady recovery with gentle needs." : "Your body is asking for a pause."}
                  </h4>
                  <p className="text-sm text-uzazi-earth/70 leading-relaxed italic">
                    &quot;{latestCheckIn?.aiSummary || "Uzazi AI is waiting for your next check-in to analyze your recovery signals and mood trends."}&quot;
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-uzazi-petal/20 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-uzazi-leaf">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Stability</span>
                  </div>
                  <p className="text-[11px] text-uzazi-earth/60 leading-normal">
                    Physical signals are aligned with typical day {mother?.postpartumDay} recovery.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-uzazi-petal/20 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-uzazi-rose">
                    <Zap size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Focus</span>
                  </div>
                  <p className="text-[11px] text-uzazi-earth/60 leading-normal">
                    Prioritize hydration and iron-rich foods this evening.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-uzazi-blush/30 bg-gradient-to-br from-white via-white to-uzazi-petal rounded-[32px]">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="w-fit">Today&apos;s Momentum</Badge>
                <CardTitle className="text-uzazi-earth">
                  Your wellness streak is strongest when care stays small and steady.
                </CardTitle>
              </div>
              <div className="rounded-full bg-uzazi-rose/10 p-3 text-uzazi-rose">
                <Sparkles className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="max-w-2xl text-sm leading-7 text-uzazi-earth/75">
                Start with a quick emotional check-in, then visit your companion if you need grounding or reassurance.
                When you complete both, your garden gains new petals and your care team receives a clearer signal.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full h-12 px-6">
                  <Link href="/checkin">Start check-in</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full h-12 px-6">
                  <Link href="/companion">Open 3AM companion</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/90 rounded-[32px] border-none shadow-soft h-fit">
            <CardHeader>
              <CardTitle className="text-uzazi-earth flex items-center gap-2">
                <Activity size={20} className="text-uzazi-rose" />
                Care markers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Heart, label: "Rest quality", note: "Two nights improving after guided breathing." },
                { icon: Sprout, label: "Nutrition", note: "Hydration goal hit 4 days in a row." },
                { icon: Flower2, label: "Mood trend", note: "Watch for overwhelm if energy dips again." },
              ].map(({ icon: Icon, label, note }) => (
                <div key={label} className="rounded-[24px] border border-uzazi-petal bg-uzazi-cream/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-uzazi-rose shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-uzazi-earth">{label}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-uzazi-earth/70">{note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CHW Connection Card */}
          <Card className="bg-uzazi-rose text-white rounded-[32px] border-none shadow-bloom overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Zap size={80} />
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Your Connection</p>
                <h4 className="text-xl font-bold">{mother?.assignedCHW || "Grace W."}</h4>
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                Your Community Health Worker is monitoring your recovery signals. You can message her directly if you have any concerns.
              </p>
              <Button variant="secondary" className="w-full rounded-full bg-white text-uzazi-rose hover:bg-white/90">
                Send a Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
