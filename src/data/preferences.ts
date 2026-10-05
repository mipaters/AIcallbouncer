import type { CallTypeRule, PreferencesState } from "../types";

export const DEFAULT_CALL_TYPE_RULES: CallTypeRule[] = [
  { category: "family", label: "Family", action: "connect" },
  { category: "school", label: "Schools", action: "ask" },
  { category: "healthcare", label: "Healthcare", action: "ask" },
  { category: "delivery", label: "Deliveries", action: "notify" },
  { category: "appointment", label: "Appointments", action: "notify" },
  { category: "work", label: "Work Contacts", action: "ask" },
  { category: "financial", label: "Financial Institutions", action: "ask" },
  { category: "government", label: "Government", action: "ask" },
  { category: "sales", label: "Sales Calls", action: "decline" },
  { category: "survey", label: "Surveys", action: "decline" },
  { category: "charity", label: "Charities", action: "notify" },
  { category: "unknown", label: "Unknown Callers", action: "ask" },
];

export const DEFAULT_PREFERENCES: PreferencesState = {
  people: {
    alwaysAllowContacts: true,
    alwaysAllowFavourites: true,
    alwaysScreenUnfamiliar: true,
    allowRepeatCallers: false,
    allowApprovedOrganizations: true,
  },
  callTypes: DEFAULT_CALL_TYPE_RULES,
  availability: "available",
  quietHours: { start: "22:00", end: "07:00" },
  suspiciousCalls: "block-and-alert",
  saveTranscript: true,
  greetingStyle: "default",
  voiceStyle: "professional",
  quickMode: "available",
};

export const GREETINGS: Record<PreferencesState["greetingStyle"], string> = {
  default:
    "Hello. You've reached Mike's personal call assistant. May I ask who is calling and what this is regarding?",
  concise: "Hello. I'm Mike's call assistant. Who is calling, and how may I help?",
  warm:
    "Hi there. I'm helping Mike manage incoming calls. May I ask your name and the reason for your call?",
  formal:
    "Hello. This call is being screened by Mike's personal call assistant. Please state your name, organization, and the purpose of your call.",
};

export const QUICK_MODE_LABEL: Record<PreferencesState["quickMode"], string> = {
  available: "Available",
  focus: "Focus",
  quiet: "Quiet",
  "family-priority": "Family Priority",
  "maximum-protection": "Maximum Protection",
};

export const QUICK_MODE_DESCRIPTION: Record<PreferencesState["quickMode"], string> = {
  available: "Important calls can be presented immediately.",
  focus: "Concierge AI screens unfamiliar calls and only interrupts for priority callers.",
  quiet: "Concierge AI handles calls silently and sends summaries.",
  "family-priority":
    "Calls involving family, school, healthcare, or emergencies receive priority.",
  "maximum-protection":
    "All unfamiliar calls are screened. Suspicious callers are blocked and all others require approval.",
};
