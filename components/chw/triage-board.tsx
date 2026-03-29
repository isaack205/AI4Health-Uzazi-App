"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, HeartPulse } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMothers } from "@/lib/hooks/use-mothers";
import { useAuth } from "@/providers/AuthProvider";

export function TriageBoard() {
  const { user } = useAuth();
  const { data: queue = [], isLoading } = useMothers(user?.uid);

  const highRiskCount = queue.filter(m => m.riskLevel === "high" || m.riskLevel === "medium").length;
  const activeCount = queue.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/90">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-uzazi-rose/10 p-3 text-uzazi-rose">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-3xl text-uzazi-earth">{String(highRiskCount).padStart(2, "0")}</p>
              <p className="text-sm text-uzazi-earth/70">Priority mothers needing contact</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-uzazi-sky/20 p-3 text-uzazi-midnight">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-3xl text-uzazi-earth">14m</p>
              <p className="text-sm text-uzazi-earth/70">Median response time this shift</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-uzazi-leaf/10 p-3 text-uzazi-leaf">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-3xl text-uzazi-earth">{activeCount}</p>
              <p className="text-sm text-uzazi-earth/70">Assigned mothers monitored</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="p-8 text-center text-uzazi-earth/60">Loading triage queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-8 text-center text-uzazi-earth/60">No mothers currently in triage queue.</div>
        ) : (
          queue.map((item) => (
            <Card key={item.uid} className="bg-white/90">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-uzazi-earth">{item.name}</CardTitle>
                  <p className="mt-2 text-sm text-uzazi-earth/70">{item.county}</p>
                </div>
                <Badge variant={item.riskLevel === "high" ? "default" : item.riskLevel === "medium" ? "info" : "success"}>
                  {item.riskLevel.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm leading-7 text-uzazi-earth/80">
                    {item.riskLevel === "high" 
                      ? "High risk pattern detected. Immediate follow-up recommended." 
                      : item.riskLevel === "medium" 
                      ? "Moderate concern. Review recent check-in when possible."
                      : "Routine follow-up with positive recovery trend."}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-uzazi-earth/45">Postpartum Day {item.postpartumDay}</p>
                </div>
                <Button asChild>
                  <Link href={`/visit/${item.uid}`}>
                    Open visit
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
