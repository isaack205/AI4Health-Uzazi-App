import { NextResponse } from "next/server";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const { checkinId, userId, riskLevel, riskScore } = await request.json();

    if (!checkinId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get user document to verify existence and maybe log info
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Write alert to Firestore
    const alertRef = await addDoc(collection(db, "alerts"), {
      userId,
      checkinId,
      riskLevel,
      riskScore,
      firedAt: serverTimestamp(),
      notifiedPartner: false,
      notifiedCHW: false,
      smsSent: false,
    });

    // 3. Write audit log (for now just console or a mock table if exists)
    // In a real app we might have an audit_logs collection
    await addDoc(collection(db, "audit_logs"), {
      userId,
      action: "partner_notified",
      timestamp: serverTimestamp(),
      metadata: { checkinId, alertId: alertRef.id }
    });

    return NextResponse.json({ success: true, alertId: alertRef.id });
  } catch (error) {
    console.error("Error notifying partner:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
