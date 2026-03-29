import { NextResponse } from "next/server";

import type { CheckIn, CheckInResponse, RiskLevel } from "@/lib/types";

interface CheckInRequest {
  userId?: string;
  responses?: CheckInResponse[];
}

function computeRiskScore(responses: CheckInResponse[]) {
  return responses.reduce((total, response) => {
    const answer = String(response.answer).toLowerCase();
    const sentimentWeight =
      response.sentiment === "negative" ? 3 : response.sentiment === "neutral" ? 1 : 0;
    const keywordWeight = /(bleed|panic|dizzy|faint|hopeless|alone|pain|fever|scared)/.test(answer) ? 2 : 0;

    return total + sentimentWeight + keywordWeight;
  }, 0);
}

function resolveRiskLevel(score: number): RiskLevel {
  if (score >= 10) {
    return "high";
  }

  if (score >= 5) {
    return "medium";
  }

  return "low";
}

function buildSummary(level: RiskLevel, responses: CheckInResponse[]) {
  const negativeThemes = responses
    .filter((response) => response.sentiment === "negative")
    .map((response) => response.questionText.toLowerCase());

  if (level === "high") {
    return `High-risk pattern detected. Responses show concern around ${negativeThemes.join(", ") || "mood and physical recovery"}. A same-day CHW review is recommended, with attention to bleeding, pain, dizziness, and emotional safety.`;
  }

  if (level === "medium") {
    return `Moderate concern detected. The check-in suggests strain around ${negativeThemes.join(", ") || "daily recovery"} and should be reviewed within the next outreach window. Offer practical support guidance and monitor for red flags.`;
  }

  return "Low-risk pattern detected. The responses suggest stable recovery today, with no immediate escalation cues. Encourage rest, hydration, and another check-in tomorrow to maintain continuity.";
}

export async function POST(request: Request) {
  const body = (await request.json()) as CheckInRequest;

  if (!body.userId || !body.responses?.length) {
    return NextResponse.json({ error: "A userId and at least one response are required." }, { status: 400 });
  }

  const riskScore = computeRiskScore(body.responses);
  const riskLevel = resolveRiskLevel(riskScore);
  const payload: CheckIn = {
    id: crypto.randomUUID(),
    userId: body.userId,
    timestamp: new Date().toISOString(),
    responses: body.responses,
    riskScore,
    riskLevel,
    aiSummary: buildSummary(riskLevel, body.responses),
  };

  return NextResponse.json(payload);
}
