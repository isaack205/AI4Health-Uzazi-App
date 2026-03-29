"use client";

import { useMutation } from "@tanstack/react-query";

import type { CheckIn, CheckInResponse } from "@/lib/types";

interface SubmitCheckInInput {
  userId: string;
  responses: CheckInResponse[];
}

export function useSubmitCheckIn() {
  return useMutation({
    mutationFn: async (payload: SubmitCheckInInput) => {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to submit check-in.");
      }

      return (await response.json()) as CheckIn;
    },
  });
}
