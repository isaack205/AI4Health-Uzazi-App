"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { UzaziAgent } from "@/lib/ai/uzazi-agent";
import { db } from "@/lib/firebase";
import { assignCHWForRisk } from "@/lib/services/chw-assignment";
import type { CheckIn, CheckInResponse, Mother } from "@/lib/types";

interface SubmitCheckInInput {
  userId: string;
  responses: CheckInResponse[];
  answersMap?: Record<string, string | number | boolean>;
  inputMode?: "guided" | "written";
  dayPostpartum?: number;
}

export function useSubmitCheckIn() {
  return useMutation({
    mutationFn: async (payload: SubmitCheckInInput) => {
      if (!payload.userId || !payload.responses.length) {
        throw new Error("A userId and responses are required.");
      }

      const userRef = doc(db, "users", payload.userId);
      const userSnap = await getDoc(userRef);
      const motherData = userSnap.exists() ? (userSnap.data() as Mother) : ({ postpartumDay: 0 } as Partial<Mother>);
      const analysis = await UzaziAgent.analyzeCheckIn(motherData, payload.responses);
      let assignment = null;

      try {
        assignment = await assignCHWForRisk(motherData, analysis.riskLevel, analysis.detectedSymptoms);
      } catch (assignmentError) {
        console.error("CHW auto-assignment failed, continuing with check-in save.", assignmentError);
      }

      const checkinRef = await addDoc(collection(db, "checkins"), {
        userId: payload.userId,
        timestamp: serverTimestamp(),
        responses: payload.responses,
        answersMap: payload.answersMap ?? {},
        inputMode: payload.inputMode ?? "written",
        dayPostpartum: payload.dayPostpartum ?? motherData.postpartumDay ?? 0,
        assignedCHW: assignment?.chwId ?? motherData.assignedCHW ?? "",
        escalatedToCHW: Boolean(assignment),
        escalationReason: assignment?.reason ?? "",
        riskScore: analysis.wellnessScore,
        riskLevel: analysis.riskLevel,
        aiSummary: analysis.empathyText,
        clinicalSummary: analysis.clinicalSummary,
        detectedSymptoms: analysis.detectedSymptoms,
        recommendedActions: analysis.recommendedActions,
      });

      await setDoc(
        userRef,
        {
          riskLevel: analysis.riskLevel,
          lastCheckInDate: new Date().toISOString().split("T")[0],
          assignedCHW: assignment?.chwId ?? motherData.assignedCHW ?? "",
          assignedCHWName: assignment?.chwName ?? motherData.assignedCHWName ?? "",
          assignmentStatus: assignment?.status ?? (analysis.riskLevel === "low" ? "stable" : motherData.assignmentStatus ?? "watch"),
          escalationReason: assignment?.reason ?? "",
          autoAssignedAt: assignment ? new Date().toISOString() : motherData.autoAssignedAt ?? "",
          lastEscalatedCheckInId: assignment ? checkinRef.id : motherData.lastEscalatedCheckInId ?? "",
        },
        { merge: true },
      );

      return {
        id: checkinRef.id,
        userId: payload.userId,
        timestamp: new Date().toISOString(),
        responses: payload.responses,
        answersMap: payload.answersMap ?? {},
        inputMode: payload.inputMode ?? "written",
        dayPostpartum: payload.dayPostpartum ?? motherData.postpartumDay ?? 0,
        assignedCHW: assignment?.chwId ?? motherData.assignedCHW ?? "",
        escalatedToCHW: Boolean(assignment),
        escalationReason: assignment?.reason ?? "",
        riskScore: analysis.wellnessScore,
        riskLevel: analysis.riskLevel,
        aiSummary: analysis.empathyText,
      } as CheckIn;
    },
  });
}

export function useLatestCheckIn(userId?: string) {
  return useQuery({
    queryKey: ["checkin-latest", userId],
    queryFn: async () => {
      if (!userId) return null;
      const q = query(
        collection(db, "checkins"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as CheckIn;
    },
    enabled: !!userId,
  });
}
