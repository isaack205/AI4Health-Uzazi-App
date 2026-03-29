"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Appointment, AppointmentType } from "@/lib/types";

export function useAppointments(userId?: string) {
  return useQuery({
    queryKey: ["appointments", userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", userId),
        orderBy("date", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
    },
    enabled: !!userId,
  });
}

export function useAddAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Appointment, "id" | "createdAt">) => {
      const docRef = await addDoc(collection(db, "appointments"), {
        ...payload,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", variables.userId] });
    }
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Appointment>) => {
      await updateDoc(doc(db, "appointments", id), updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "appointments", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });
}
