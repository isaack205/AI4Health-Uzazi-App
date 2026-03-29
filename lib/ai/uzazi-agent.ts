import type { Mother, CheckInResponse, RiskLevel, CompanionMessage } from "@/lib/types";

export interface AnalysisResult {
  empathyText: string;
  clinicalSummary: string;
  detectedSymptoms: string[];
  wellnessScore: number;
  riskLevel: RiskLevel;
  recommendedActions: string[];
}

export class UzaziAgent {
  /**
   * High-risk physical symptoms that trigger immediate escalation.
   */
  private static DANGER_SYMPTOMS = {
    bleeding: /(heavy bleeding|soaking pads|large clots|hemorrhage)/i,
    fever: /(fever|chills|burning up|high temp)/i,
    infection: /(pus|foul smell|redness|swelling|incision)/i,
    preeclampsia: /(blurred vision|severe headache|swelling hands|swelling face|dizzy)/i,
    suicide: /(suicide|kill myself|end my life|harm the baby|hurt the baby)/i,
  };

  /**
   * Analyzes a daily check-in to provide a dual-purpose insight.
   */
  static async analyzeCheckIn(mother: Partial<Mother>, responses: CheckInResponse[]): Promise<AnalysisResult> {
    const combinedAnswers = responses.map(r => r.answer).join(" ").toLowerCase();
    const symptoms: string[] = [];
    let score = 85; // Start with a healthy score

    // Check for Danger Symptoms
    Object.entries(this.DANGER_SYMPTOMS).forEach(([name, regex]) => {
      if (regex.test(combinedAnswers)) {
        symptoms.push(name);
        score -= 25;
      }
    });

    // Check Sentiment
    const negativeResponses = responses.filter(r => r.sentiment === "negative");
    score -= (negativeResponses.length * 10);

    // Contextual adjustment based on postpartum day
    const day = mother.postpartumDay ?? 0;
    if (day <= 7 && symptoms.includes("bleeding")) {
      // Very early days, some bleeding is normal but "heavy" is still a flag
      score -= 10;
    }

    const riskLevel = score < 40 ? "high" : score < 70 ? "medium" : "low";

    return {
      wellnessScore: Math.max(0, score),
      riskLevel,
      detectedSymptoms: symptoms,
      empathyText: this.generateEmpathyText(riskLevel, symptoms, day),
      clinicalSummary: this.generateClinicalSummary(mother, responses, symptoms, score),
      recommendedActions: this.getActions(riskLevel, symptoms),
    };
  }

  /**
   * Generates a streaming-ready emotional support response for the companion chat.
   */
  static async generateCompanionReply(
    mother: Partial<Mother>,
    message: string,
    history: CompanionMessage[]
  ): Promise<{ content: string; triggerBreathing: boolean; isCrisis: boolean }> {
    const input = message.toLowerCase();
    let triggerBreathing = false;
    let isCrisis = false;

    // Crisis detection
    if (this.DANGER_SYMPTOMS.suicide.test(input)) {
      isCrisis = true;
      return {
        content: "I hear how much pain you're in, but I'm very worried about your safety. Please, reach out to Befrienders Kenya at 0722 178 177 or go to the nearest hospital right now. You are not alone, and there is help available this very second.",
        triggerBreathing: false,
        isCrisis: true
      };
    }

    // Anxiety detection
    if (/(anxious|panic|racing heart|scared|overwhelmed)/i.test(input)) {
      triggerBreathing = true;
      return {
        content: "The nights can feel so heavy when anxiety moves in. I'm right here. Before we talk more, let's try a small grounding exercise together. Just focus on my circle's rhythm. You're doing okay.",
        triggerBreathing: true,
        isCrisis: false
      };
    }

    // Normalizing mother's feelings (Mama Bear Persona)
    const responses = [
      "I'm listening, Mama. It's completely normal to feel this way on day " + (mother.postpartumDay ?? "X") + ". Your body and heart are doing so much work.",
      "Thank you for sharing that with me. Even in the middle of the night, your feelings are valid. What can I do to make this moment feel a little lighter for you?",
      "I hear you. The postpartum journey isn't a straight line. Some nights are for resting, and some are just for getting through. I'm proud of you for reaching out.",
    ];

    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      triggerBreathing: false,
      isCrisis: false
    };
  }

  private static generateEmpathyText(level: RiskLevel, symptoms: string[], day: number): string {
    if (level === "high") {
      return "Mama, I'm noticing some signals that your body or heart needs immediate attention. It's okay to ask for help—in fact, it's the strongest thing you can do right now.";
    }
    if (level === "medium") {
      return "You're doing a great job, but it sounds like things are a bit strained today. Let's focus on one small act of rest or care in the next hour.";
    }
    return "Your signals look steady today. On day " + day + ", finding this rhythm is a huge win. Keep nourishing yourself.";
  }

  private static generateClinicalSummary(m: Partial<Mother>, res: CheckInResponse[], sym: string[], score: number): string {
    return `Wellness Score: ${score}/100. Symptoms detected: ${sym.join(", ") || "None"}. Mother is on Day ${m.postpartumDay}. ${res.length} responses processed. Primary concern: ${sym.length > 0 ? "Physical red flags" : "Emotional strain"}.`;
  }

  private static getActions(level: RiskLevel, symptoms: string[]): string[] {
    const actions = ["Hydrate with 8 glasses of water", "Rest when baby sleeps"];
    if (level === "high") actions.push("Contact CHW immediately", "Visit nearest clinic");
    if (symptoms.includes("infection")) actions.push("Keep incision area dry", "Do not apply oils to wound");
    return actions;
  }
}
