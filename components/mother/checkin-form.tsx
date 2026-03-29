"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, increment, updateDoc } from "firebase/firestore";
import {
  BedDouble,
  Brain,
  Droplets,
  Flower2,
  Heart,
  Milk,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitCheckIn } from "@/lib/hooks/use-checkin";
import type { CheckInResponse, Mother, Sentiment } from "@/lib/types";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

type InputMode = "guided" | "written";

type GuidedAnswers = {
  moodScore: number;
  sleepHours: number;
  emotionalSymptoms: string[];
  bodySignals: string[];
  supportNeed: string;
  feedingMethod: string;
  babyConcern: string;
};

const prompts = [
  { id: "mood", title: "How is your mood today?", placeholder: "Calm, tired, overwhelmed, hopeful..." },
  { id: "sleep", title: "How was your sleep in the last 24 hours?", placeholder: "Broken sleep, restful naps, none..." },
  { id: "body", title: "What is your body telling you right now?", placeholder: "Pain, dizziness, breast discomfort..." },
  { id: "support", title: "What support do you need most today?", placeholder: "Rest, food, help with baby care..." },
] as const;

const guidedSections = [
  {
    key: "overall",
    title: "Start with a quick pulse",
    description: "A few taps are enough. Uzazi will turn this into a clear summary.",
  },
  {
    key: "feelings",
    title: "How is your heart feeling?",
    description: "Choose every feeling that showed up today.",
  },
  {
    key: "body",
    title: "What is your body saying?",
    description: "Tap any body signals you noticed today.",
  },
  {
    key: "care",
    title: "What care do you need most?",
    description: "Help us understand what support would make today gentler.",
  },
] as const;

const moodOptions = [
  { score: 1, emoji: "😔", label: "Very low" },
  { score: 2, emoji: "😟", label: "Low" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😊", label: "Great" },
];

const emotionalOptions = [
  { id: "anxiety", label: "Anxiety / worry", icon: Brain },
  { id: "overwhelmed", label: "Feeling overwhelmed", icon: Sparkles },
  { id: "sadness", label: "Sadness", icon: Heart },
  { id: "alone", label: "Feeling alone", icon: ShieldAlert },
];

const bodyOptions = [
  { id: "fever", label: "Fever / feeling hot", tone: "danger" },
  { id: "headache", label: "Headache", tone: "warning" },
  { id: "swelling", label: "Swelling", tone: "warning" },
  { id: "bleedingHeavy", label: "Heavy bleeding", tone: "danger" },
  { id: "bleedingModerate", label: "Moderate bleeding", tone: "warning" },
  { id: "breastPain", label: "Breast pain", tone: "warning" },
  { id: "woundPain", label: "Wound or stitch pain", tone: "warning" },
  { id: "dizzy", label: "Dizziness", tone: "warning" },
];

const supportOptions = [
  { id: "rest", label: "Rest", icon: BedDouble },
  { id: "hydration", label: "Water or food", icon: Droplets },
  { id: "someoneToTalkTo", label: "Someone to talk to", icon: Heart },
  { id: "healthWorker", label: "A health worker check-in", icon: Stethoscope },
];

const feedingOptions = [
  { id: "breast", label: "Breastfeeding", icon: Milk },
  { id: "mixed", label: "Breast + formula", icon: Milk },
  { id: "formula", label: "Formula feeding", icon: Milk },
];

const babyConcernOptions = [
  { id: "well", label: "Baby seems okay" },
  { id: "watching", label: "I am a bit worried" },
  { id: "urgent", label: "I need help sooner" },
];

function inferSentiment(answer: string): Sentiment {
  const value = answer.toLowerCase();

  if (/(sad|overwhelmed|cry|pain|bleed|anxious|alone|scared|dizzy|panic|fever|urgent)/.test(value)) {
    return "negative";
  }

  if (/(good|better|calm|supported|strong|rested|hopeful|okay)/.test(value)) {
    return "positive";
  }

  return "neutral";
}

function ToggleCard({
  active,
  onClick,
  title,
  description,
  icon,
  className,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[28px] border p-4 text-left transition-all",
        active
          ? "border-uzazi-rose bg-uzazi-petal/60 shadow-bloom"
          : "border-white bg-white hover:border-uzazi-blush/40",
        className,
      )}
    >
      {icon ? <div className="mb-3 text-uzazi-rose">{icon}</div> : null}
      <p className="font-semibold text-uzazi-earth">{title}</p>
      {description ? <div className="mt-1 text-sm leading-6 text-uzazi-earth/65">{description}</div> : null}
    </button>
  );
}

export function CheckInForm() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const mutation = useSubmitCheckIn();

  const [inputMode, setInputMode] = useState<InputMode>("guided");
  const [guidedStep, setGuidedStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    mood: "",
    sleep: "",
    body: "",
    support: "",
  });
  const [hoursSlept, setHoursSlept] = useState("4");
  const [guidedAnswers, setGuidedAnswers] = useState<GuidedAnswers>({
    moodScore: 3,
    sleepHours: 6,
    emotionalSymptoms: [],
    bodySignals: [],
    supportNeed: "rest",
    feedingMethod: "breast",
    babyConcern: "well",
  });
  const [petalsEarned, setPetalsEarned] = useState<number | null>(null);
  const [streakEarned, setStreakEarned] = useState<number | null>(null);

  const mother = user && "postpartumDay" in user ? (user as Mother) : null;

  const guidedSummary = useMemo(() => {
    const bleeding =
      guidedAnswers.bodySignals.includes("bleedingHeavy")
        ? "heavy"
        : guidedAnswers.bodySignals.includes("bleedingModerate")
          ? "moderate"
          : "light";

    return {
      moodScore: guidedAnswers.moodScore,
      sleepHours: guidedAnswers.sleepHours,
      anxiety:
        guidedAnswers.emotionalSymptoms.includes("anxiety") || guidedAnswers.emotionalSymptoms.includes("overwhelmed")
          ? "mild"
          : "none",
      fever: guidedAnswers.bodySignals.includes("fever"),
      headache: guidedAnswers.bodySignals.includes("headache"),
      swelling: guidedAnswers.bodySignals.includes("swelling"),
      bleeding,
      woundPain: guidedAnswers.bodySignals.includes("woundPain") ? "mild" : "none",
      breastfeedingPain: guidedAnswers.bodySignals.includes("breastPain"),
      babyUrgent: guidedAnswers.babyConcern === "urgent",
      supportNeed: guidedAnswers.supportNeed,
      feedingMethod: guidedAnswers.feedingMethod,
    };
  }, [guidedAnswers]);

  const toggleMultiValue = (field: "emotionalSymptoms" | "bodySignals", value: string) => {
    setGuidedAnswers((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const buildGuidedPayload = () => {
    const emotionText =
      guidedAnswers.emotionalSymptoms.length > 0
        ? guidedAnswers.emotionalSymptoms.join(", ")
        : "steady";
    const bodyText =
      guidedAnswers.bodySignals.length > 0
        ? guidedAnswers.bodySignals.join(", ")
        : "no major body alarms";

    const responses: CheckInResponse[] = [
      {
        questionId: "moodScore",
        questionText: "How are you feeling overall?",
        answer: `Mood score ${guidedAnswers.moodScore}/5`,
        sentiment: guidedAnswers.moodScore >= 4 ? "positive" : guidedAnswers.moodScore <= 2 ? "negative" : "neutral",
      },
      {
        questionId: "sleepHours",
        questionText: "How many hours did you sleep?",
        answer: `${guidedAnswers.sleepHours} hours`,
        sentiment: guidedAnswers.sleepHours >= 6 ? "positive" : "negative",
      },
      {
        questionId: "emotionalSymptoms",
        questionText: "Which feelings showed up today?",
        answer: emotionText,
        sentiment: inferSentiment(emotionText),
      },
      {
        questionId: "bodySignals",
        questionText: "What is your body saying today?",
        answer: bodyText,
        sentiment: inferSentiment(bodyText),
      },
      {
        questionId: "supportNeed",
        questionText: "What support do you need most?",
        answer: guidedAnswers.supportNeed,
        sentiment: "neutral",
      },
      {
        questionId: "feeding",
        questionText: "How are feeding and baby care going?",
        answer: `${guidedAnswers.feedingMethod}; baby concern: ${guidedAnswers.babyConcern}`,
        sentiment: guidedAnswers.babyConcern === "urgent" ? "negative" : "neutral",
      },
    ];

    return {
      responses,
      answersMap: guidedSummary,
      sessionSymptoms: {
        ...guidedSummary,
        emotionalSymptoms: guidedAnswers.emotionalSymptoms,
        bodySignals: guidedAnswers.bodySignals,
      },
    };
  };

  const buildWrittenPayload = () => {
    const responses: CheckInResponse[] = prompts.map((prompt) => ({
      questionId: prompt.id,
      questionText: prompt.title,
      answer: prompt.id === "sleep" ? `${hoursSlept} hours. ${answers[prompt.id]}` : answers[prompt.id],
      sentiment: inferSentiment(answers[prompt.id]),
    }));

    return {
      responses,
      answersMap: {
        moodScore: inferSentiment(answers.mood) === "positive" ? 4 : inferSentiment(answers.mood) === "negative" ? 2 : 3,
        sleepHours: Number(hoursSlept),
      },
      sessionSymptoms: answers,
    };
  };

  const submit = async () => {
    if (!user?.uid) {
      throw new Error("Your session is still loading. Please wait a moment and try again.");
    }

    const payload = inputMode === "guided" ? buildGuidedPayload() : buildWrittenPayload();

    const result = await mutation.mutateAsync({
      userId: user.uid,
      responses: payload.responses,
      answersMap: payload.answersMap,
      inputMode,
      dayPostpartum: mother?.postpartumDay ?? 0,
    });

    let earned = 5;
    let newStreak = 1;
    let isNewCheckIn = true;

    if (mother) {
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
      }
    }

    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        const updates: Record<string, unknown> = {
          gardenPetals: increment(earned),
        };

        if (isNewCheckIn) {
          updates.lastCheckInDate = new Date().toISOString().split("T")[0];
          updates.currentStreak = newStreak;
        }

        await updateDoc(userRef, updates);
        setPetalsEarned(earned);
        setStreakEarned(newStreak);
      } catch (error) {
        console.error("Failed to update petals and streak", error);
      }
    }

    sessionStorage.setItem(
      "latest_checkin",
      JSON.stringify({
        checkinId: result.id,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        aiAdvice: result.aiSummary,
        dayPostpartum: mother?.postpartumDay ?? 0,
        symptoms: payload.answersMap,
      }),
    );

    router.push("/checkin/result");
  };

  const canAdvanceGuided = true;
  const sectionProgress = ((guidedStep + 1) / guidedSections.length) * 100;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden border-white/80">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge className="w-fit bg-uzazi-petal text-uzazi-rose">{t("chat_tab")}</Badge>
            <Badge variant="muted">Day {mother?.postpartumDay ?? 0}</Badge>
          </div>
          <div>
            <CardTitle className="text-uzazi-earth">Choose the easiest way to check in today.</CardTitle>
            <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">
              Tap through a guided check-in or keep using your own words. Both paths feed the same AI summary and
              history timeline.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ToggleCard
              active={inputMode === "guided"}
              onClick={() => setInputMode("guided")}
              title="Guided taps"
              description="Fast, low-effort, and easy when you feel tired."
            />
            <ToggleCard
              active={inputMode === "written"}
              onClick={() => setInputMode("written")}
              title="Write it in your own words"
              description="Keep the original typing flow when you want more nuance."
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {inputMode === "guided" ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-uzazi-earth/40">
                  <span>
                    {guidedStep + 1} of {guidedSections.length}
                  </span>
                  <span>{guidedSections[guidedStep].title}</span>
                </div>
                <div className="h-2 rounded-full bg-uzazi-petal/70">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-uzazi-rose to-uzazi-amber transition-all"
                    style={{ width: `${sectionProgress}%` }}
                  />
                </div>
                <p className="text-sm leading-6 text-uzazi-earth/70">{guidedSections[guidedStep].description}</p>
              </div>

              <div className="min-h-[340px] animate-in slide-in-from-right-4 duration-300">
                {guidedStep === 0 ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-uzazi-earth">How are you feeling today, {user?.name?.split(" ")[0] ?? "Mama"}?</p>
                      <div className="grid grid-cols-5 gap-2">
                        {moodOptions.map((option) => (
                          <button
                            key={option.score}
                            type="button"
                            onClick={() => setGuidedAnswers((current) => ({ ...current, moodScore: option.score }))}
                            className={cn(
                              "rounded-[24px] border px-2 py-4 text-center transition-all",
                              guidedAnswers.moodScore === option.score
                                ? "border-uzazi-rose bg-uzazi-petal/70 scale-[1.03]"
                                : "border-white bg-white",
                            )}
                          >
                            <div className="text-2xl">{option.emoji}</div>
                            <div className="mt-2 text-[11px] font-semibold text-uzazi-earth">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[28px] bg-uzazi-cream/60 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-uzazi-earth">How many hours did you sleep?</p>
                        <Badge variant="muted">{guidedAnswers.sleepHours} hrs</Badge>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={12}
                        step={1}
                        value={guidedAnswers.sleepHours}
                        onChange={(event) =>
                          setGuidedAnswers((current) => ({ ...current, sleepHours: Number(event.target.value) }))
                        }
                        className="w-full accent-[#d14b75]"
                      />
                    </div>
                  </div>
                ) : null}

                {guidedStep === 1 ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {emotionalOptions.map((option) => {
                        const Icon = option.icon;
                        const active = guidedAnswers.emotionalSymptoms.includes(option.id);
                        return (
                          <ToggleCard
                            key={option.id}
                            active={active}
                            onClick={() => toggleMultiValue("emotionalSymptoms", option.id)}
                            title={option.label}
                            icon={<Icon className="h-5 w-5" />}
                            className="min-h-24"
                          />
                        );
                      })}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {feedingOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setGuidedAnswers((current) => ({ ...current, feedingMethod: option.id }))}
                            className={cn(
                              "rounded-[24px] border p-4 text-left transition-all",
                              guidedAnswers.feedingMethod === option.id
                                ? "border-uzazi-rose bg-uzazi-petal/60"
                                : "border-white bg-white",
                            )}
                          >
                            <Icon className="h-5 w-5 text-uzazi-rose" />
                            <p className="mt-3 text-sm font-semibold text-uzazi-earth">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {guidedStep === 2 ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {bodyOptions.map((option) => {
                        const active = guidedAnswers.bodySignals.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleMultiValue("bodySignals", option.id)}
                            className={cn(
                              "rounded-[24px] border p-4 text-left transition-all",
                              active
                                ? option.tone === "danger"
                                  ? "border-rose-500 bg-rose-50"
                                  : "border-amber-300 bg-amber-50"
                                : "border-white bg-white",
                            )}
                          >
                            <p className="text-sm font-semibold text-uzazi-earth">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>
                    {guidedAnswers.bodySignals.includes("fever") || guidedAnswers.bodySignals.includes("bleedingHeavy") ? (
                      <div className="rounded-[24px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        Uzazi will flag this check-in more urgently so your care team can see it sooner.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {guidedStep === 3 ? (
                  <div className="space-y-6">
                    <div className="grid gap-3 md:grid-cols-2">
                      {supportOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setGuidedAnswers((current) => ({ ...current, supportNeed: option.id }))}
                            className={cn(
                              "rounded-[24px] border p-4 text-left transition-all",
                              guidedAnswers.supportNeed === option.id
                                ? "border-uzazi-rose bg-uzazi-petal/60"
                                : "border-white bg-white",
                            )}
                          >
                            <Icon className="h-5 w-5 text-uzazi-rose" />
                            <p className="mt-3 text-sm font-semibold text-uzazi-earth">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-uzazi-earth">How does your baby seem today?</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {babyConcernOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setGuidedAnswers((current) => ({ ...current, babyConcern: option.id }))}
                            className={cn(
                              "rounded-[24px] border p-4 text-left transition-all",
                              guidedAnswers.babyConcern === option.id
                                ? option.id === "urgent"
                                  ? "border-rose-500 bg-rose-50"
                                  : "border-uzazi-rose bg-uzazi-petal/60"
                                : "border-white bg-white",
                            )}
                          >
                            <p className="text-sm font-semibold text-uzazi-earth">{option.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setGuidedStep((current) => Math.max(0, current - 1))}
                  disabled={guidedStep === 0}
                >
                  Back
                </Button>
                {guidedStep < guidedSections.length - 1 ? (
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => setGuidedStep((current) => Math.min(guidedSections.length - 1, current + 1))}
                    disabled={!canAdvanceGuided}
                  >
                    Next
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={() => void submit()} disabled={loading || mutation.isPending || !!petalsEarned || !user?.uid}>
                    {mutation.isPending ? "Submitting..." : petalsEarned ? "Check-in Complete" : "Submit check-in"}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-5">
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

              <Button className="w-full" onClick={() => void submit()} disabled={loading || mutation.isPending || !!petalsEarned || !user?.uid}>
                {mutation.isPending ? "Submitting..." : petalsEarned ? "Check-in Complete" : "Submit check-in"}
              </Button>
            </div>
          )}
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
                You earned {petalsEarned} new petals for checking in honestly today.
              </p>
              {streakEarned && streakEarned > 1 ? (
                <div className="mt-4 rounded-full bg-uzazi-rose/10 px-4 py-2 text-sm font-semibold text-uzazi-rose">
                  {streakEarned} day streak
                </div>
              ) : null}
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
                  <Badge
                    variant={
                      mutation.data.riskLevel === "high"
                        ? "default"
                        : mutation.data.riskLevel === "medium"
                          ? "info"
                          : "success"
                    }
                  >
                    {mutation.data.riskLevel.toUpperCase()} RISK
                  </Badge>
                  <Badge variant="muted">Score {mutation.data.riskScore}</Badge>
                  <Badge variant="muted">{inputMode === "guided" ? "Guided taps" : "Written check-in"}</Badge>
                </div>
                <p className="text-sm leading-7 text-uzazi-earth/80">{mutation.data.aiSummary}</p>
              </>
            ) : (
              <p className="text-sm leading-7 text-uzazi-earth/70">
                After you submit, UZAZI will translate your taps or written words into one summary for you and your care
                team.
              </p>
            )}

            {inputMode === "guided" && !mutation.data ? (
              <div className="rounded-[24px] bg-white/80 p-4 text-sm leading-6 text-uzazi-earth/70">
                <p className="font-semibold text-uzazi-earth">Today&apos;s quick signal</p>
                <p>Mood {guidedSummary.moodScore}/5, sleep {guidedSummary.sleepHours} hrs, support need: {guidedSummary.supportNeed}.</p>
              </div>
            ) : null}

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
