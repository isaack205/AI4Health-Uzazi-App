import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { UzaziAgent } from "@/lib/ai/uzazi-agent";
import type { Mother } from "@/lib/types";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { message, conversationHistory, userId, language } = await req.json();

    // 1. Get contextual data for the agent
    let motherData: Partial<Mother> = { postpartumDay: 0 };
    if (userId) {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (userSnap.exists()) motherData = userSnap.data();
      } catch (e) {
        console.warn("Context fetch failed in edge runtime:", e);
      }
    }

    // 2. Generate response using Unified Agent
    const result = await UzaziAgent.generateCompanionReply(motherData, message, conversationHistory);

    // 3. Night Gamification (10PM - 6AM)
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 6;
    let earnedPetals = 0;

    if (isNight && userId) {
      earnedPetals = 5;
      try {
        await updateDoc(doc(db, "users", userId), {
          gardenPetals: increment(earnedPetals)
        });
      } catch (e) {
        console.error("Failed to award night petals:", e);
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendData = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Stream the response word by word for a natural feel
        const words = result.content.split(" ");
        for (const word of words) {
          sendData({ 
            content: word + " ", 
            isCrisis: result.isCrisis, 
            triggerBreathing: result.triggerBreathing,
            earnedPetals: earnedPetals > 0 ? earnedPetals : undefined
          });
          await new Promise((resolve) => setTimeout(resolve, 60));
        }

        sendData("[DONE]");
        controller.close();

        // 4. Handle Crisis Alerting in background
        if (result.isCrisis && userId) {
          fetch(`${new URL(req.url).origin}/api/companion/alert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, alertType: "crisis", messageContent: message })
          }).catch(err => console.error("Crisis alert failed:", err));
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Companion API error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
