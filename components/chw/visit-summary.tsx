"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity, ClipboardList, PhoneCall } from "lucide-react";

export function VisitSummary({ visitId }: { visitId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestData() {
      // For this demo, we use visitId as the userId if it's formatted that way, 
      // or fetch the most recent checkin in the system.
      const q = query(
        collection(db, "checkins"),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSummary(snap.docs[0].data());
      }
      setLoading(false);
    }
    fetchLatestData();
  }, [visitId]);

  if (loading) return <div className="p-8 text-center animate-pulse">Analyzing clinical signals...</div>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="bg-white/90 border-none shadow-soft rounded-[32px]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-uzazi-earth/40">Clinical Handover</p>
              <CardTitle className="text-2xl text-uzazi-earth">Signal Analysis</CardTitle>
            </div>
            <Badge variant={summary?.riskLevel === 'high' ? 'default' : 'info'}>
              {summary?.riskLevel?.toUpperCase() || 'LOW'} ATTENTION
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-[28px] bg-uzazi-rose/5 border border-uzazi-rose/10 p-6 space-y-3">
            <div className="flex items-center gap-2 text-uzazi-rose">
              <Activity size={18} />
              <p className="text-xs font-bold uppercase tracking-wider text-uzazi-rose/70">Unified Agent Summary</p>
            </div>
            <p className="text-sm leading-7 text-uzazi-earth/80 font-medium italic">
              &quot;{summary?.clinicalSummary || "No clinical red flags detected in latest session. Patient appears stable for routine follow-up."}&quot;
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-uzazi-earth/30 px-1">Bio-Signal Markers</p>
            <div className="grid gap-3">
              {(summary?.detectedSymptoms?.length > 0 ? summary.detectedSymptoms : ["No acute symptoms"]).map((item: string) => (
                <div key={item} className="flex items-center gap-3 rounded-[22px] border border-uzazi-earth/5 bg-white p-4 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-uzazi-rose animate-pulse" />
                  <p className="text-sm font-semibold text-uzazi-earth/75 capitalize">{item.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 border-none shadow-soft rounded-[32px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-uzazi-rose" />
            <CardTitle className="text-uzazi-earth">Outreach Protocol</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(summary?.recommendedActions || [
            "Perform routine wellness check via phone call.",
            "Verify hydration and infant feeding progress.",
            "Schedule next CHW home visit for week 2 review."
          ]).map((detail: string, idx: number) => (
            <div key={idx} className="flex gap-4 rounded-[24px] border border-uzazi-petal bg-uzazi-cream/70 p-4 transition-all hover:bg-uzazi-petal/40">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-uzazi-rose text-sm font-bold shadow-sm">
                {idx + 1}
              </div>
              <p className="text-sm leading-relaxed text-uzazi-earth/80 flex items-center">{detail}</p>
            </div>
          ))}
          
          <Button className="w-full h-14 rounded-2xl bg-uzazi-rose text-white shadow-bloom gap-2 mt-4">
            <PhoneCall size={18} />
            Initialize Care Call
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
