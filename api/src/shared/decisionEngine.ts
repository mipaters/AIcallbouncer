export type RiskLevel = "low" | "moderate" | "high";
export type Disposition = "connect" | "ask" | "notify" | "voicemail" | "decline" | "block";
export type CallCategory =
  | "family"
  | "school"
  | "healthcare"
  | "delivery"
  | "appointment"
  | "work"
  | "financial"
  | "government"
  | "sales"
  | "survey"
  | "charity"
  | "unknown"
  | "suspicious";

export interface DecisionResult {
  callerName: string;
  organization: string;
  callPurpose: string;
  callCategory: CallCategory;
  urgency: "low" | "medium" | "high";
  requestedAction: string;
  identityConfidence: "low" | "medium" | "high";
  riskLevel: RiskLevel;
  riskSignals: string[];
  recommendedDisposition: Disposition;
  decisionExplanation: string;
  subscriberNotification: string;
  suggestedFollowUpQuestion?: string;
  requiresSubscriberApproval: boolean;
  requiresImmediateTermination: boolean;
  disclaimer: string;
  source: "azure" | "simulation";
}

export const DISCLAIMER =
  "Illustrative demonstration data. This assessment is AI-generated, may be incomplete or incorrect, and is not connected to real Rogers network, billing, or security systems.";

const CREDENTIAL_PATTERNS =
  /(verification code|one-time code|otp|pin\b|password|social insurance|sin number|card number|cvv|banking (password|credentials))/i;
const URGENCY_PATTERNS = /(immediately|right now|urgent|suspend|act now|limited time|before it's too late)/i;
const SECRECY_PATTERNS = /(don't tell|do not tell|keep this|don't call anyone|secret)/i;
const PAYMENT_PATTERNS = /(transfer money|send money|gift card|wire transfer|payment|e-transfer)/i;

const CATEGORY_KEYWORDS: { category: CallCategory; patterns: RegExp }[] = [
  { category: "school", patterns: /(school|teacher|principal|classroom)/i },
  { category: "healthcare", patterns: /(doctor|dental|clinic|health|dr\.|appointment confirm|test results)/i },
  { category: "delivery", patterns: /(delivery|package|courier|parcel|driver)/i },
  { category: "financial", patterns: /(bank|credit union|loan|mortgage|visa|mastercard)/i },
  { category: "government", patterns: /(cra|canada revenue|government|tax|service canada)/i },
  { category: "sales", patterns: /(offer|promotion|free assessment|discount|special deal|book a visit)/i },
  { category: "survey", patterns: /(survey|opinion|few minutes|feedback)/i },
  { category: "charity", patterns: /(charity|donation|non-profit|fundrais)/i },
  { category: "family", patterns: /(it's me|your (son|daughter|brother|sister|mom|dad)|family)/i },
  { category: "appointment", patterns: /(appointment|confirm.*(tomorrow|today)|reschedul)/i },
];

function classifyCategory(text: string): CallCategory {
  for (const { category, patterns } of CATEGORY_KEYWORDS) {
    if (patterns.test(text)) return category;
  }
  return "unknown";
}

function assessRisk(text: string): { level: RiskLevel; signals: string[] } {
  const signals: string[] = [];
  if (CREDENTIAL_PATTERNS.test(text)) signals.push("Request for a password, PIN, or verification code");
  if (URGENCY_PATTERNS.test(text)) signals.push("Pressure to act immediately");
  if (SECRECY_PATTERNS.test(text)) signals.push("Request for secrecy");
  if (PAYMENT_PATTERNS.test(text)) signals.push("Request involving a payment or money transfer");

  let level: RiskLevel = "low";
  if (signals.length >= 2) level = "high";
  else if (signals.length === 1) level = "moderate";
  return { level, signals };
}

function recommendDisposition(category: CallCategory, risk: RiskLevel): Disposition {
  if (risk === "high") return "block";
  switch (category) {
    case "family":
      return "connect";
    case "school":
    case "healthcare":
    case "work":
    case "financial":
    case "government":
      return risk === "moderate" ? "voicemail" : "ask";
    case "delivery":
    case "appointment":
    case "charity":
      return "notify";
    case "sales":
    case "survey":
      return "decline";
    case "suspicious":
      return "block";
    default:
      return risk === "moderate" ? "voicemail" : "ask";
  }
}

/**
 * Deterministic classification used whenever Azure OpenAI is not configured,
 * or when a call to Azure OpenAI fails. This guarantees the API always
 * returns a valid, structured decision ("Simulation Mode" / "Error Mode").
 */
export function analyzeCallerTextDeterministic(text: string, recognized: boolean): DecisionResult {
  const category = recognized ? "family" : classifyCategory(text);
  const { level, signals } = assessRisk(text);
  const disposition = recognized ? "connect" : recommendDisposition(category, level);

  const explanationParts: string[] = [];
  if (recognized) {
    explanationParts.push("Caller matched a recognized, trusted number.");
  } else {
    explanationParts.push(`Call classified as ${category}.`);
    explanationParts.push(signals.length ? `Detected signals: ${signals.join("; ")}.` : "No high-risk signals detected.");
  }

  return {
    callerName: recognized ? "Recognized Contact" : "Unknown Caller",
    organization: "Not provided",
    callPurpose: text.slice(0, 180),
    callCategory: category,
    urgency: level === "high" ? "high" : level === "moderate" ? "medium" : "low",
    requestedAction: "Not specified",
    identityConfidence: recognized ? "high" : "low",
    riskLevel: level,
    riskSignals: signals,
    recommendedDisposition: disposition,
    decisionExplanation: explanationParts.join(" "),
    subscriberNotification: `A caller was screened and the recommended action is: ${disposition}.`,
    suggestedFollowUpQuestion:
      signals.length || category === "unknown" ? "What is your full name and organization?" : undefined,
    requiresSubscriberApproval: disposition === "ask",
    requiresImmediateTermination: disposition === "block",
    disclaimer: DISCLAIMER,
    source: "simulation",
  };
}

/** Validates a DecisionResult-shaped object received from a model before it is returned to the frontend. */
export function isValidDecisionResult(value: unknown): value is DecisionResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.callCategory === "string" &&
    typeof v.riskLevel === "string" &&
    typeof v.recommendedDisposition === "string" &&
    typeof v.decisionExplanation === "string"
  );
}
