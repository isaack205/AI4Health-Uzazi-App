"use client";

import { useMutation } from "@tanstack/react-query";

import type { CompanionMessage } from "@/lib/types";

interface CompanionPayload {
  messages: CompanionMessage[];
}

export function useCompanionReply() {
  return useMutation({
    mutationFn: async (payload: CompanionPayload) => {
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to reach the companion right now.");
      }

      return (await response.json()) as { message: CompanionMessage };
    },
  });
}
