// Shared domain types for the Rogers Concierge AI demo.
// All data modeled here is synthetic and used only for illustrative purposes.

export type Disposition =
  | "connect"
  | "ask"
  | "notify"
  | "voicemail"
  | "decline"
  | "block";

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  connect: "Connect Now",
  ask: "Ask Me",
  notify: "Notify Me",
  voicemail: "Send to Voicemail",
  decline: "Politely Decline",
  block: "Block and Alert",
};

export type RiskLevel = "low" | "moderate" | "high";

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

export const CALL_CATEGORY_LABEL: Record<CallCategory, string> = {
  family: "Family",
  school: "School",
  healthcare: "Healthcare",
  delivery: "Delivery",
  appointment: "Appointment",
  work: "Work Contact",
  financial: "Financial Institution",
  government: "Government",
  sales: "Sales",
  survey: "Survey",
  charity: "Charity",
  unknown: "Unknown",
  suspicious: "Suspicious",
};

export type AvailabilityMode =
  | "available"
  | "meeting"
  | "focus"
  | "driving"
  | "quiet-hours"
  | "vacation"
  | "do-not-disturb";

export const AVAILABILITY_LABEL: Record<AvailabilityMode, string> = {
  available: "Available",
  meeting: "In a Meeting",
  focus: "Focus Time",
  driving: "Driving",
  "quiet-hours": "Quiet Hours",
  vacation: "Vacation",
  "do-not-disturb": "Do Not Disturb",
};

export type QuickMode =
  | "available"
  | "focus"
  | "quiet"
  | "family-priority"
  | "maximum-protection";

export interface TranscriptLine {
  speaker: "concierge" | "caller" | "system";
  text: string;
}

export interface LiveUnderstanding {
  callerName?: string;
  organization?: string;
  purpose?: string;
  urgency?: "low" | "medium" | "high";
  requestedAction?: string;
  callCategory?: CallCategory;
  riskLevel?: RiskLevel;
  identityConfidence?: "low" | "medium" | "high";
  recommendedOutcome?: Disposition;
}

export interface ScenarioStep {
  callerLine?: string;
  conciergeLine?: string;
  systemNote?: string;
  understanding?: Partial<LiveUnderstanding>;
  riskSignals?: string[];
  /** Alternate caller responses the presenter can pick in Interactive Caller mode. */
  alternateCallerLines?: string[];
}

export interface Scenario {
  id: string;
  title: string;
  shortLabel: string;
  callerName: string;
  callerNumber: string;
  recognized: boolean;
  approximateLocation?: string;
  category: CallCategory;
  steps: ScenarioStep[];
  finalDisposition: Disposition;
  decisionExplanation: string;
  subscriberNotification: string;
  presenterNotes: {
    callerWants: string;
    conciergeAsks: string;
    relevantPreferences: string;
    whyThisOutcome: string;
    whatIsSimulated: string;
    whatRequiresProduction: string;
  };
}

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

export interface CallTypeRule {
  category: CallCategory;
  label: string;
  action: Disposition;
}

export interface PreferencesState {
  people: {
    alwaysAllowContacts: boolean;
    alwaysAllowFavourites: boolean;
    alwaysScreenUnfamiliar: boolean;
    allowRepeatCallers: boolean;
    allowApprovedOrganizations: boolean;
  };
  callTypes: CallTypeRule[];
  availability: AvailabilityMode;
  quietHours: { start: string; end: string };
  suspiciousCalls:
    | "block-and-alert"
    | "voicemail-and-alert"
    | "ask-before-blocking";
  saveTranscript: boolean;
  greetingStyle: "default" | "concise" | "warm" | "formal";
  voiceStyle: "warm" | "professional" | "concise";
  quickMode: QuickMode;
}

export interface TrustedCaller {
  id: string;
  name: string;
  category:
    | "personal"
    | "family"
    | "school"
    | "healthcare"
    | "work"
    | "home-services"
    | "delivery"
    | "approved-org";
  number: string;
  status: "always-allow" | "always-screen" | "temporarily-allow";
  addedOn: string;
}

export interface CallHistoryEntry {
  id: string;
  callerName: string;
  number: string;
  recognized: boolean;
  category: CallCategory;
  reason: string;
  disposition: Disposition;
  riskLevel: RiskLevel;
  time: string;
  durationSeconds: number;
  transcriptAvailable: boolean;
  messageAvailable: boolean;
  subscriberAction: string;
  transcript: TranscriptLine[];
  decisionExplanation: string;
  questionsAsked: string[];
  signalsDetected: string[];
}

export interface ExecutiveMetrics {
  callsScreened: number;
  interruptionsAvoided: number;
  priorityCallsConnected: number;
  messagesCapatured: number;
  callsToVoicemail: number;
  unwantedDeclined: number;
  suspiciousBlocked: number;
  averageScreeningSeconds: number;
  decisionsByType: { category: string; count: number }[];
}

export type ServiceConnectionState =
  | "connected"
  | "partial"
  | "simulation";

export interface DemoStatus {
  mode: ServiceConnectionState;
  azureOpenAIConfigured: boolean;
  azureSpeechConfigured: boolean;
  message: string;
  realCallsConfigured?: boolean;
  twilioValidationConfigured?: boolean;
}
