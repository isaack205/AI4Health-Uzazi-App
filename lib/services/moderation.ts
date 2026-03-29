export interface ScanResult {
  isSafe: boolean;
  reason?: string;
}

const CRISIS_KEYWORDS = [
  // English
  "suicide", "kill myself", "end my life", "harm my baby", "hurt my baby", "want to die", "better off dead", "self-harm",
  // Swahili
  "kujiua", " kujiua", "niue", "niue mtoto", "sitaki kuishi", "bora nife", "jiumiza",
  // Kikuyu
  "kwĩũraga", "kũũraga mwana", "ndirenda gũtũũra", "kwĩhũũra", "ngwenda gũkua"
];

export function scanContent(text: string): ScanResult {
  const content = text.toLowerCase();
  
  const containsCrisis = CRISIS_KEYWORDS.some(keyword => content.includes(keyword));
  
  if (containsCrisis) {
    return {
      isSafe: false,
      reason: "crisis_detected"
    };
  }

  // Add more checks here (e.g. offensive language, PII)
  const piiRegex = /\b(\+254|07)\d{8,9}\b/; // Simple Kenyan phone number check
  if (piiRegex.test(content)) {
    return {
      isSafe: false,
      reason: "pii_detected"
    };
  }

  return { isSafe: true };
}
