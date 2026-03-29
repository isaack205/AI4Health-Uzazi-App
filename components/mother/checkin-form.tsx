"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, increment } from "firebase/firestore";
import { Flower2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitCheckIn } from "@/lib/hooks/use-checkin";
import type { CheckInResponse, Sentiment, Mother } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";

const prompts = [
  { id: "mood", title: "How is your mood today?", placeholder: "Calm, tired, overwhelmed, hopeful..." },
  { id: "sleep", title: "How was your sleep in the last 24 hours?", placeholder: "Broken sleep, restful naps, none..." },
  { id: "body", title: "What is your body telling you right now?", placeholder: "Pain, dizziness, breast discomfort..." },
  { id: "support", title: "What support do you need most today?", placeholder: "Rest, food, help with baby care..." },
];

function inferSentiment(answer: string): Sentiment {
  const value = answer.toLowerCase();

  if (/(sad|overwhelmed|cry|pain|bleed|anxious|alone|scared|dizzy|panic)/.test(value)) {
    return "negative";
  }

  if (/(good|better|calm|supported|strong|rested|hopeful)/.test(value)) {
    return "positive";
  }

  return "neutral";
}

export function CheckInForm() {
  const { user } = useAuth();
  const router = useRouter();
  const mutation = useSubmitCheckIn();
  const [answers, setAnswers] = useState<Record<string, string>>({
    mood: "",
    sleep: "",
    body: "",
    support: "",
  });
  const [hoursSlept, setHoursSlept] = useState("4");
  const [petalsEarned, setPetalsEarned] = useState<number | null>(null);
  const [streakEarned, setStreakEarned] = useState<number | null>(null);

  const submit = async () => {
    const responses: CheckInResponse[] = prompts.map((prompt) => ({
      questionId: prompt.id,
      questionText: prompt.title,
      answer: prompt.id === "sleep" ? `${hoursSlept} hours. ${answers[prompt.id]}` : answers[prompt.id],
      sentiment: inferSentiment(answers[prompt.id]),
    }));

    const result = await mutation.mutateAsync({
      userId: user?.uid ?? "guest-mother",
      responses,
    });

    let earned = 5; // Base reward
    let newStreak = 1;
    let isNewCheckIn = true;
    
    if (user && "lastCheckInDate" in user) {
      const mother = user as Mother;
      const todayDate = new Date();
      const today = todayDate.toISOString().split("T")[0];
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split("T")[0];

      const lastCheckIn = mother.lastCheckInDate;
      const currentStreak = mother.currentStreak || 0;

      if (lastCheckIn === today) {
        isNewCheckIn = false;
        earned = 2;
        newStreak = currentStreak;
      } else if (lastCheckIn === yesterday) {
        newStreak = currentStreak + 1;
        earned += 3;
      } else {
        newStreak = 1;
      }
    }

    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        const updates: any = {
          gardenPetals: increment(earned),
        };
        
        if (isNewCheckIn) {
          updates.lastCheckInDate = new Date().toISOString().split("T")[0];
          updates.currentStreak = newStreak;
        }

        await updateDoc(userRef, updates);
      } catch (error) {
        console.error("Failed to update petals and streak", error);
      }
    }

    // Save result to session storage for the result screen payoff
    sessionStorage.setItem("latest_checkin", JSON.stringify({
      checkinId: result.id,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      aiAdvice: result.aiSummary,
      dayPostpartum: (user as Mother)?.postpartumDay ?? 0,
      symptoms: answers
    }));

    router.push("/checkin/result");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <Badge className="w-fit">Daily Emotional Triage</Badge>
          <CardTitle className="text-uzazi-earth">Capture today&apos;s signal in under two minutes.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-uzazi-earth">Approximate hours slept</label>
            <Input value={hoursSlept} onChange={(event) => setHoursSlept(event.target.value)} inputMode="numeric" />
          </div>

          {prompts.map((prompt) => (
            <div key={prompt.id} className="space-y-2">
              <label className="text-sm font-medium text-uzazi-earth">{prompt.title}</label>
              <Textarea
                placeholder={prompt.placeholder}
                value={answers[prompt.id]}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [prompt.id]: event.target.value,
                  }))
                }
              />
            </div>
          ))}

          <Button className="w-full" onClick={() => void submit()} disabled={mutation.isPending || !!petalsEarned}>
            {mutation.isPending ? "Submitting..." : petalsEarned ? "Check-in Complete" : "Submit check-in"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {petalsEarned ? (
          <Card className="animate-in slide-in-from-bottom-4 fade-in overflow-hidden border-uzazi-blush/40 bg-gradient-to-br from-white to-uzazi-petal/60 duration-500">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-bloom">
                <Flower2 className="h-10 w-10 animate-bounce text-uzazi-rose" />
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-uzazi-rose text-sm font-bold text-white shadow-sm">
                  +{petalsEarned}
                </div>
              </div>
              <p className="mt-6 text-xl font-semibold text-uzazi-rose">Your garden is growing!</p>
              <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">
                You earned {petalsEarned} new petals for taking a moment to reflect and share your truth today.
              </p>
              
              {streakEarned && streakEarned > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-uzazi-rose/10 px-4 py-2 text-uzazi-rose">
                  <span className="text-xl">🔥</span>
                  <span className="font-semibold">{streakEarned} Day Streak!</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className="bg-gradient-to-br from-white via-white to-uzazi-petal">
          <CardHeader>
            <CardTitle className="text-uzazi-earth">AI summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mutation.data ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={mutation.data.riskLevel === "high" ? "default" : mutation.data.riskLevel === "medium" ? "info" : "success"}>
                    {mutation.data.riskLevel.toUpperCase()} RISK
                  </Badge>
                  <Badge variant="muted">Score {mutation.data.riskScore}</Badge>
                </div>
                <p className="text-sm leading-7 text-uzazi-earth/80">{mutation.data.aiSummary}</p>
              </>
            ) : (
              <p className="text-sm leading-7 text-uzazi-earth/70">
                After you submit, UZAZI will cluster the responses into a quick summary and flag whether your CHW should
                see this sooner.
              </p>
            )}

            {mutation.error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {(mutation.error as Error).message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
