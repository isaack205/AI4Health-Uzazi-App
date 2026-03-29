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
        mothers.push(doc.data() as Mother);
      });

      return mothers;
    },
    enabled: !!chwId,
    staleTime: 60_000,
  });
}
