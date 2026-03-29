import { collection, getDocs, limit, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { CHW, Mother, RiskLevel } from "@/lib/types";

interface AssignmentResult {
  chwId: string;
  chwName: string;
  reason: string;
  status: "watch" | "urgent";
}

async function countAssignedMothers(chwId: string) {
  const mothersRef = collection(db, "users");
  const assignedQuery = query(
    mothersRef,
    where("role", "==", "mother"),
    where("assignedCHW", "==", chwId),
  );
  const snapshot = await getDocs(assignedQuery);
  return snapshot.size;
}

export async function assignCHWForRisk(
  mother: Partial<Mother>,
  riskLevel: RiskLevel,
  detectedSymptoms: string[],
): Promise<AssignmentResult | null> {
  if (riskLevel === "low") {
    return null;
  }

  if (mother.assignedCHW) {
    return {
      chwId: mother.assignedCHW,
      chwName: mother.assignedCHWName ?? "Assigned CHW",
      reason:
        riskLevel === "high"
          ? `High-risk check-in detected${detectedSymptoms.length ? `: ${detectedSymptoms.join(", ")}` : ""}`
          : "Moderate-risk check-in needs watchful follow-up",
      status: riskLevel === "high" ? "urgent" : "watch",
    };
  }

  const usersRef = collection(db, "users");
  const countyMatches = mother.county
    ? query(usersRef, where("role", "==", "chw"), where("county", "==", mother.county), limit(10))
    : null;
  const fallbackQuery = query(usersRef, where("role", "==", "chw"), limit(20));

  const primarySnapshot = countyMatches ? await getDocs(countyMatches) : null;
  const fallbackSnapshot = await getDocs(fallbackQuery);
  const chwDocs = (primarySnapshot && !primarySnapshot.empty ? primarySnapshot.docs : fallbackSnapshot.docs).map((entry) => ({
    uid: entry.id,
    ...(entry.data() as CHW),
  }));

  if (chwDocs.length === 0) {
    return null;
  }

  const loads = await Promise.all(
    chwDocs.map(async (chw) => ({
      chw,
      load: await countAssignedMothers(chw.uid),
    })),
  );

  loads.sort((left, right) => left.load - right.load);
  const chosen = loads[0]?.chw;

  if (!chosen) {
    return null;
  }

  return {
    chwId: chosen.uid,
    chwName: chosen.name,
    reason:
      riskLevel === "high"
        ? `Auto-routed after a high-risk check-in${detectedSymptoms.length ? `: ${detectedSymptoms.join(", ")}` : ""}`
        : "Auto-routed for early CHW watch because risk moved above baseline",
    status: riskLevel === "high" ? "urgent" : "watch",
  };
}
