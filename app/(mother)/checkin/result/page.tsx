"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Share2, Save, ExternalLink, Droplets, Moon, Calendar, MessageCircle, AlertCircle, ShieldAlert, Ambulance, Sparkles } from "lucide-react";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { AIAdviceCard } from "@/components/ui/AIAdviceCard";
import { SymptomChip } from "@/components/ui/SymptomChip";
import { ActionCard } from "@/components/ui/ActionCard";
import { getSymptomChips } from "@/lib/utils/symptomUtils";
import { useToast } from "@/providers/ToastProvider";
import type { Mother, CheckIn, RiskLevel } from "@/lib/types";

export default function ResultPage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    async function loadData() {
      // 1. Try session storage
      const cached = sessionStorage.getItem("latest_checkin");
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
        return;
      }

      // 2. Fetch from Firestore if direct navigation
      if (user?.uid) {
        try {
          const checkinsRef = collection(db, "checkins");
          const q = query(
            checkinsRef,
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const checkin = snapshot.docs[0].data() as CheckIn;
            setData({
              checkinId: snapshot.docs[0].id,
              riskScore: checkin.riskScore,
              riskLevel: checkin.riskLevel,
              aiAdvice: checkin.aiSummary,
              dayPostpartum: checkin.dayPostpartum ?? (user as Mother).postpartumDay,
              symptoms: checkin.answersMap && Object.keys(checkin.answersMap).length > 0
                ? checkin.answersMap
                : checkin.responses.reduce((acc: any, r) => ({ ...acc, [r.questionId]: r.answer }), {})
            });
          } else {
            router.replace("/checkin");
          }
        } catch (err) {
          console.error("Failed to fetch check-in", err);
          router.replace("/checkin");
        } finally {
          setLoading(false);
        }
      }
    }

    loadData();
  }, [user, router]);

  // Animated score counter
  useEffect(() => {
    if (!data?.riskScore) return;
    
    let start = 0;
    const end = data.riskScore;
    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutExpo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentScore = Math.floor(easedProgress * end);
      
      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [data?.riskScore]);

  const riskTheme = useMemo(() => {
    if (!data) return {};
    switch (data.riskLevel as RiskLevel | "critical") {
      case "low":
        return { 
          bg: "bg-[#E8F5EE]", 
          border: "border-uzazi-sage", 
          summary: t("result.summaryLow"),
          badgeVariant: "success"
        };
      case "medium":
        return { 
          bg: "bg-[#FDF3E3]", 
          border: "border-uzazi-amber", 
          summary: t("result.summaryMedium"),
          badgeVariant: "info"
        };
      case "high":
        return { 
          bg: "bg-[#FFF0EC]", 
          border: "border-uzazi-terracotta", 
          summary: t("result.summaryHigh"),
          badgeVariant: "default"
        };
      case "critical":
        return { 
          bg: "bg-[#FDECEC]", 
          border: "border-rose-500", 
          summary: t("result.summaryCritical"),
          pulse: "animate-pulse-slow",
          badgeVariant: "destructive"
        };
      default:
        return {};
    }
  }, [data?.riskLevel, t]);

  const symptomChips = useMemo(() => {
    if (!data?.symptoms) return [];
    return getSymptomChips(data.symptoms, t);
  }, [data?.symptoms, t]);

  const handleNotifyPartner = async () => {
    if (!user || !data) return;
    try {
      const res = await fetch("/api/alerts/notify-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkinId: data.checkinId,
          userId: user.uid,
          riskLevel: data.riskLevel,
          riskScore: data.riskScore
        })
      });
      if (res.ok) {
        toast({ title: "Partner notified", description: "A message has been sent to your emergency contact." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const actions = useMemo(() => {
    if (!data) return [];
    const level = data.riskLevel;
    
    interface UIAction {
      icon: any;
      title: string;
      desc: string;
      href?: string;
      onPress?: () => void;
      variant?: string;
    }

    const lowActions: UIAction[] = [
      { icon: Droplets, title: "Stay hydrated", desc: "Drink at least 8 glasses of water today" },
      { icon: Moon, title: "Rest when baby sleeps", desc: "Sleep is essential for your recovery" },
      { icon: Calendar, title: "Keep postnatal appointments", desc: "Follow-up is key to health", href: "/history" }
    ];
    
    const mediumActions: UIAction[] = [
      { icon: Phone, title: "Contact your CHW", desc: "Share your symptoms with your CHW" },
      { icon: ShieldAlert, title: "Monitor closely", desc: "Check your symptoms again tomorrow" },
      { icon: Calendar, title: "Check next appointment", desc: "Review your care timeline", href: "/history" }
    ];
    
    const highActions: UIAction[] = [
      { icon: ShieldAlert, title: "Visit health facility today", desc: "Do not wait. Go to your nearest clinic.", variant: "danger" },
      { icon: Phone, title: "Call your CHW now", desc: "Get professional guidance immediately" },
      { icon: MessageCircle, title: "Inform your partner", desc: "Send an automated update to your partner", onPress: handleNotifyPartner }
    ];
    
    const criticalActions: UIAction[] = [
      { icon: Ambulance, title: "Go to emergency NOW", desc: "This is urgent. Go to the nearest facility.", variant: "danger" },
      { icon: Phone, title: "Call emergency contact", desc: "Reach out to your trusted contact now", href: `tel:${(user as Mother)?.trustedContactPhone}` },
      { icon: AlertCircle, title: "Call emergency services", desc: "Dial 0800 723 253 (Kenya health helpline)", href: "tel:0800723253" }
    ];

    if (level === "low") return lowActions;
    if (level === "medium") return mediumActions;
    if (level === "high") return highActions;
    if (level === "critical") return criticalActions;
    
    return [];
  }, [data?.riskLevel, user, t, handleNotifyPartner]);

  const handleShareWhatsApp = () => {
    if (!data) return;
    const summary = data.aiAdvice.split('.').slice(0, 2).join('.') + '.';
    const text = `Habari! Uzazi check-in summary for Day ${data.dayPostpartum}:\nRisk level: ${data.riskLevel.toUpperCase()}\nScore: ${data.riskScore}/100\n\n${summary}\n\n— Sent via Uzazi app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const dayTip = useMemo(() => {
    const day = data?.dayPostpartum || 1;
    return t(`tips.day${Math.min(day, 42)}`);
  }, [data?.dayPostpartum, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-uzazi-cream">
        <div className="h-12 w-12 rounded-full border-4 border-uzazi-rose border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-uzazi-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-uzazi-cream/80 px-4 py-4 backdrop-blur-md">
        <button onClick={() => router.push("/dashboard")} className="rounded-full bg-white p-2 shadow-sm text-uzazi-earth">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-uzazi-earth">{t("result.title")}</h1>
        <Badge variant="default" className="border-uzazi-rose bg-uzazi-petal text-uzazi-rose font-bold rounded-full px-3 py-1 shadow-none">
          Day {data.dayPostpartum}
        </Badge>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Risk Hero */}
        <Card className={`overflow-hidden border-2 ${riskTheme.border} ${riskTheme.bg} ${riskTheme.pulse || ''} shadow-soft transition-all duration-500`}>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="relative">
              <span className="text-7xl font-bold text-uzazi-earth tabular-nums">{displayScore}</span>
              <span className="absolute -right-8 bottom-2 text-uzazi-earth/40 font-medium">/100</span>
            </div>
            
            <div className="mt-6">
              <RiskBadge riskLevel={data.riskLevel} t={t} />
            </div>
            
            <p className="mt-4 text-uzazi-earth font-medium leading-relaxed">
              {riskTheme.summary}
            </p>
          </CardContent>
        </Card>

        {data.riskLevel === "critical" && (
          <Button 
            className="w-full h-14 rounded-2xl bg-uzazi-rose hover:bg-rose-600 text-lg gap-2 shadow-bloom animate-bounce"
            onClick={() => window.open(`tel:${(user as Mother)?.trustedContactPhone}`)}
          >
            <Phone className="h-5 w-5" />
            {t("result.callEmergency")}
          </Button>
        )}

        {/* AI Advice */}
        <AIAdviceCard 
          advice={data.aiAdvice} 
          language={locale === "en" ? "English" : locale === "sw" ? "Kiswahili" : "Gĩkũyũ"} 
          loading={false} 
          t={t}
        />

        {/* Symptoms */}
        <div className="space-y-3">
          <h3 className="font-semibold text-uzazi-earth px-1">{t("result.symptomsTitle")}</h3>
          <div className="flex flex-wrap gap-2">
            {symptomChips.length > 0 ? (
              symptomChips.map((chip, idx) => (
                <SymptomChip key={idx} label={chip.label} severity={chip.severity} />
              ))
            ) : (
              <p className="text-sm text-uzazi-earth/50 italic">No specific symptoms reported today.</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-uzazi-earth px-1">{t("result.actionsTitle")}</h3>
          <div className="grid gap-3">
            {actions.map((action, idx) => (
              <ActionCard 
                key={idx}
                icon={action.icon}
                title={action.title}
                description={action.desc}
                href={action.href}
                onPress={action.onPress}
                variant={action.variant as any}
              />
            ))}
          </div>
        </div>

        {/* Daily Tip */}
        <Card className="bg-uzazi-petal/30 border-uzazi-blush/30 rounded-[28px] overflow-hidden">
          <CardContent className="p-6 flex gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-uzazi-rose shrink-0 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-uzazi-earth">{t("result.tipTitle")}</h4>
              <p className="mt-1 text-sm leading-relaxed text-uzazi-earth/80">
                {dayTip}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share/Save */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button 
            variant="outline" 
            className="h-14 rounded-2xl gap-2 border-uzazi-earth/10 bg-white"
            onClick={() => toast({ title: t("result.savedToast") })}
          >
            <Save className="h-5 w-5 text-uzazi-earth/60" />
            {t("result.saveToHistory")}
          </Button>
          <Button 
            variant="outline" 
            className="h-14 rounded-2xl gap-2 border-uzazi-earth/10 bg-white text-uzazi-leaf hover:bg-uzazi-leaf/5"
            onClick={handleShareWhatsApp}
          >
            <Share2 className="h-5 w-5" />
            {t("result.shareWithCHW")}
          </Button>
        </div>
      </main>
    </div>
  );
}
