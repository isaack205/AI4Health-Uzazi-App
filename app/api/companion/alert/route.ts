import { NextResponse } from "next/server";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { userId, alertType, messageContent } = await req.json();

    if (!userId || alertType !== "crisis") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1. Write to chw_alerts
    await setDoc(doc(db, "chw_alerts", userId), {
      userId,
      type: "night_crisis",
      messageContent,
      timestamp: serverTimestamp(),
      resolved: false
    });

    // 2. Log to audit_log
    await addDoc(collection(db, "audit_log"), {
      userId,
      action: "companion_crisis_alert",
      details: messageContent,
      timestamp: serverTimestamp()
    });

    // 3. Trigger SMS (Feature 4 - placeholder)
    console.log(`[ALERT] Triggering SMS to trusted contact for user ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
