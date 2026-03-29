"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Mother } from "@/lib/types";

export function useMothers(chwId?: string) {
  return useQuery({
    queryKey: ["mothers", chwId],
    queryFn: async () => {
      if (!chwId) return [];

      const mothersRef = collection(db, "users");
      // Fetch users who are mothers and assigned to this specific CHW
      const q = query(
        mothersRef,
        where("role", "==", "mother"),
        where("assignedCHW", "==", chwId)
      );

      const snapshot = await getDocs(q);
      const mothers: Mother[] = [];
      
      snapshot.forEach((doc) => {
        mothers.push({ uid: doc.id, ...(doc.data() as Mother) });
      });

      return mothers.sort((left, right) => {
        const rank = { urgent: 0, watch: 1, stable: 2 } as const;
        const leftRank = rank[left.assignmentStatus ?? "stable"];
        const rightRank = rank[right.assignmentStatus ?? "stable"];
        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        const leftRisk = left.riskLevel === "high" ? 0 : left.riskLevel === "medium" ? 1 : 2;
        const rightRisk = right.riskLevel === "high" ? 0 : right.riskLevel === "medium" ? 1 : 2;
        return leftRisk - rightRisk;
      });
    },
    enabled: !!chwId,
    staleTime: 60_000,
  });
}
