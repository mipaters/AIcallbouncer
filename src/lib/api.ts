import type { DemoStatus } from "../types";
import { analyzeCallerText } from "../engine/decisionEngine";

const API_TIMEOUT_MS = 3500;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let cachedStatus: DemoStatus | null = null;

/** Determine Connected / Partial / Simulation mode by pinging the API's demo-status route. */
export async function getDemoStatus(): Promise<DemoStatus> {
  if (cachedStatus) return cachedStatus;
  try {
    const res = await fetchWithTimeout("/api/demo-status", { method: "GET" });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as DemoStatus;
    cachedStatus = data;
    return data;
  } catch {
    const fallback: DemoStatus = {
      mode: "simulation",
      azureOpenAIConfigured: false,
      azureSpeechConfigured: false,
      message:
        "Running in Simulation Mode. The API or Azure AI services are unavailable, so Doorperson AI is using scripted, deterministic responses.",
    };
    cachedStatus = fallback;
    return fallback;
  }
}

export function resetDemoStatusCache() {
  cachedStatus = null;
}

/**
 * Analyze free-form caller text (used by Microphone Simulation and the
 * Interactive Caller mode). Tries the API first, then falls back to the
 * local deterministic engine so the app always works offline.
 */
export async function analyzeCallerResponse(text: string, recognized: boolean) {
  try {
    const res = await fetchWithTimeout("/api/process-caller-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, recognized }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch {
    return analyzeCallerText(text, recognized);
  }
}

export interface ParsedPreferenceRule {
  description: string;
  callType: string;
  action: string;
}

/** Deterministic parser for the natural-language preference examples in the spec. */
function deterministicParsePreferences(input: string): ParsedPreferenceRule[] {
  const rules: ParsedPreferenceRule[] = [];
  const lower = input.toLowerCase();

  if (lower.includes("family") || lower.includes("children") || lower.includes("school")) {
    rules.push({ description: "Always put through calls from family and school contacts.", callType: "family / school", action: "connect" });
  }
  if (lower.includes("healthcare") || lower.includes("doctor") || lower.includes("dental")) {
    rules.push({ description: "Ask me before connecting healthcare-related calls.", callType: "healthcare", action: "ask" });
  }
  if (lower.includes("sales")) {
    rules.push({ description: "Send sales calls to voicemail unless I have requested the call.", callType: "sales", action: "voicemail" });
  }
  if (lower.includes("survey")) {
    rules.push({ description: "Automatically decline survey calls.", callType: "survey", action: "decline" });
  }
  if (lower.includes("charity") || lower.includes("donation")) {
    rules.push({ description: "Notify me about charity calls without interrupting.", callType: "charity", action: "notify" });
  }
  if (rules.length === 0) {
    rules.push({ description: "No recognizable preference statements were found. Please rephrase.", callType: "unknown", action: "ask" });
  }
  return rules;
}

export async function parsePreferences(input: string): Promise<{ rules: ParsedPreferenceRule[]; source: "azure" | "simulation" }> {
  try {
    const res = await fetchWithTimeout("/api/parse-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch {
    return { rules: deterministicParsePreferences(input), source: "simulation" };
  }
}
