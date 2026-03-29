import { NextResponse } from "next/server";
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { UzaziAgent } from "@/lib/ai/uzazi-agent";
import type { CheckIn, CheckInResponse, Mother } from "@/lib/types";

interface CheckInRequest {
  userId: string;
  responses: CheckInResponse[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckInRequest;

    if (!body.userId || !body.responses?.length) {
      return NextResponse.json({ error: "A userId and responses are required." }, { status: 400 });
    }

    // 1. Get user profile for context
    const userRef = doc(db, "users", body.userId);
    const userSnap = await getDoc(userRef);
    const motherData = userSnap.exists() ? (userSnap.data() as Mother) : { postpartumDay: 0 };

    // 2. Use the Unified Uzazi Agent for analysis
    const analysis = await UzaziAgent.analyzeCheckIn(motherData, body.responses);

    // 3. Save the check-in record
    const checkinRef = await addDoc(collection(db, "checkins"), {
      userId: body.userId,
      timestamp: serverTimestamp(),
      responses: body.responses,
      riskScore: analysis.wellnessScore,
      riskLevel: analysis.riskLevel,
      aiSummary: analysis.empathyText,
      clinicalSummary: analysis.clinicalSummary,
      detectedSymptoms: analysis.detectedSymptoms,
      recommendedActions: analysis.recommendedActions,
    });

    // 4. Sync user profile with the latest risk level
    await setDoc(userRef, {
      riskLevel: analysis.riskLevel,
      lastCheckInDate: new Date().toISOString().split("T")[0],
    }, { merge: true });

    const payload: CheckIn = {
      id: checkinRef.id,
      userId: body.userId,
      timestamp: new Date().toISOString(),
      responses: body.responses,
      riskScore: analysis.wellnessScore,
      riskLevel: analysis.riskLevel,
      aiSummary: analysis.empathyText,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Check-in processing failed. Full error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to process check-in: ${errorMessage}` }, { status: 500 });
  }
}
