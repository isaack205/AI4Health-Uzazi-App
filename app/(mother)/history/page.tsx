"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { ChevronDown, ChevronUp, Share2, ClipboardCheck, TrendingUp, LayoutGrid } from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SymptomChip } from "@/components/ui/SymptomChip";
import { DayProgressStrip } from "@/components/ui/DayProgressStrip";
import { getSymptomChips } from "@/lib/utils/symptomUtils";
import type { CheckIn, Mother } from "@/lib/types";

function normalizeDate(value: unknown) {
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === "string" || value instanceof Date) {
    return new Date(value);
  }

  return new Date();
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!user?.uid) return;
      
      try {
        const q = query(
          collection(db, "checkins"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dayPostpartum: doc.data().dayPostpartum || 1,
          answersMap: doc.data().answersMap || {},
        }));
        setCheckins(data);
      } catch (err) {
        console.error("Error loading history", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const stats = useMemo(() => {
    if (checkins.length === 0) return { count: 0, streak: 0, avg: 0 };
    const avg = Math.round(checkins.reduce((acc, curr) => acc + curr.riskScore, 0) / checkins.length);
    const streak = (user as Mother)?.currentStreak || 0;
    return { count: checkins.length, streak, avg };
  }, [checkins, user]);

  const handleShareWhatsApp = (checkin: any) => {
    const summary = checkin.aiSummary.split('.').slice(0, 2).join('.') + '.';
    const text = `Habari! Uzazi check-in summary for Day ${checkin.dayPostpartum}:\nRisk level: ${checkin.riskLevel.toUpperCase()}\nScore: ${checkin.riskScore}/100\n\n${summary}\n\n— Sent via Uzazi app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-uzazi-cream">
        <div className="h-12 w-12 rounded-full border-4 border-uzazi-rose border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-uzazi-cream pb-32">
      <header className="bg-white/50 border-b border-uzazi-earth/5 px-6 py-8 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-3xl font-bold text-uzazi-earth">{t("history.title")}</h1>
        <p className="mt-1 text-uzazi-earth/60 font-medium">{t("history.subtitle")}</p>
      </header>

      <main className="p-4 space-y-8 max-w-2xl mx-auto">
        {/* 42 Day Progress */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-uzazi-earth/40">Journey Timeline</h3>
            <span className="text-xs font-semibold text-uzazi-rose">Day {(user as Mother)?.postpartumDay ?? 1} of 42</span>
          </div>
          <Card className="bg-white/80 border-white shadow-sm rounded-3xl overflow-hidden p-4">
            <DayProgressStrip 
              checkins={checkins} 
              currentDay={(user as Mother)?.postpartumDay ?? 1}
              onDayPress={(day) => {
                const target = checkins.find(c => c.dayPostpartum === day);
                if (target) {
                  document.getElementById(`card-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setExpandedId(target.id);
                }
              }}
            />
          </Card>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white border-white shadow-sm rounded-[24px] text-center p-4">
            <p className="text-2xl font-bold text-uzazi-earth">{stats.count}</p>
            <p className="text-[10px] uppercase font-bold text-uzazi-earth/40 mt-1">{t("history.totalCheckins")}</p>
          </Card>
          <Card className="bg-white border-white shadow-sm rounded-[24px] text-center p-4">
            <p className="text-2xl font-bold text-uzazi-rose">{stats.streak}d</p>
            <p className="text-[10px] uppercase font-bold text-uzazi-earth/40 mt-1">{t("history.currentStreak")}</p>
          </Card>
          <Card className="bg-white border-white shadow-sm rounded-[24px] text-center p-4">
            <p className="text-2xl font-bold text-uzazi-amber">{stats.avg}</p>
            <p className="text-[10px] uppercase font-bold text-uzazi-earth/40 mt-1">{t("history.avgRisk")}</p>
          </Card>
        </div>

        {/* List */}
        <div className="space-y-4">
          {checkins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="relative h-48 w-48 opacity-80">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <circle cx="100" cy="100" r="80" fill="#FFEBF0" />
                  <path d="M100 140C122.091 140 140 122.091 140 100C140 77.9086 122.091 60 100 60C77.9086 60 60 77.9086 60 100C60 122.091 77.9086 140 100 140Z" fill="#FF8BA7" fillOpacity="0.2" />
                  <path d="M100 120C111.046 120 120 111.046 120 100C120 88.9543 111.046 80 100 80C88.9543 80 80 88.9543 80 100C80 111.046 88.9543 120 100 120Z" fill="#FF8BA7" />
                </svg>
              </div>
              <div className="space-y-2 px-8">
                <h3 className="text-xl font-bold text-uzazi-earth">{t("history.empty")}</h3>
                <p className="text-sm text-uzazi-earth/60">Every reflection adds a petal to your garden and clarity to your care team.</p>
              </div>
              <Button onClick={() => router.push("/checkin")} className="rounded-full px-8 h-12">
                Start today&apos;s check-in
              </Button>
            </div>
          ) : (
            checkins.map((checkin) => {
              const isExpanded = expandedId === checkin.id;
              const dateStr = normalizeDate(checkin.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const symptomSource =
                checkin.answersMap && Object.keys(checkin.answersMap).length > 0
                  ? checkin.answersMap
                  : checkin.responses.reduce((acc: any, r: any) => ({ ...acc, [r.questionId]: r.answer }), {});
              
              return (
                <Card 
                  key={checkin.id} 
                  id={`card-${checkin.id}`}
                  className={`bg-white border-white shadow-soft transition-all duration-300 rounded-[32px] overflow-hidden ${isExpanded ? 'ring-2 ring-uzazi-rose/20' : ''}`}
                >
                  <CardContent className="p-0">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : checkin.id)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-uzazi-cream border border-uzazi-petal/50 text-uzazi-earth">
                          <span className="text-[10px] uppercase font-bold text-uzazi-earth/40">{dateStr.split(' ')[0]}</span>
                          <span className="text-xl font-bold leading-none">{dateStr.split(' ')[1]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-uzazi-rose">DAY {checkin.dayPostpartum}</span>
                            <RiskBadge riskLevel={checkin.riskLevel} t={t} />
                          </div>
                          <p className="text-sm text-uzazi-earth/70 line-clamp-1 pr-4">
                            {checkin.aiSummary.split('.')[0]}.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold tabular-nums ${
                          checkin.riskLevel === 'low' ? 'text-uzazi-sage' : 
                          checkin.riskLevel === 'medium' ? 'text-uzazi-amber' : 
                          'text-uzazi-rose'
                        }`}>
                          {checkin.riskScore}
                        </span>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-uzazi-earth/30" /> : <ChevronDown className="h-5 w-5 text-uzazi-earth/30" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                        <div className="border-t border-uzazi-earth/5 pt-5 space-y-4">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-uzazi-earth/40">Symptoms</h4>
                            <div className="flex flex-wrap gap-2">
                              {getSymptomChips(symptomSource, t).map((chip, idx) => (
                                <SymptomChip key={idx} label={chip.label} severity={chip.severity} />
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-uzazi-earth/40">AI Advice</h4>
                            <p className="text-[15px] leading-relaxed text-uzazi-earth/80 bg-uzazi-cream/50 p-4 rounded-2xl border border-uzazi-petal/20">
                              {checkin.aiSummary}
                            </p>
                          </div>

                          <Button 
                            variant="outline" 
                            className="w-full h-12 rounded-2xl border-uzazi-earth/10 gap-2 text-uzazi-leaf hover:bg-uzazi-leaf/5"
                            onClick={() => handleShareWhatsApp(checkin)}
                          >
                            <Share2 className="h-4 w-4" />
                            {t("result.shareWithCHW")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
