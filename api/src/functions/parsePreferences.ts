import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { isAzureOpenAIConfigured, readEnv } from "../shared/env";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateText, ValidationError } from "../shared/validation";

interface ParsedRule {
  description: string;
  callType: string;
  action: string;
}

function deterministicParse(input: string): ParsedRule[] {
  const lower = input.toLowerCase();
  const rules: ParsedRule[] = [];

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

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

async function tryAzureParse(input: string): Promise<ParsedRule[] | null> {
  const env = readEnv();
  if (!isAzureOpenAIConfigured(env)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `${env.azureOpenAIEndpoint}/openai/deployments/${env.azureOpenAIDeployment}/chat/completions?api-version=2024-08-01-preview`;
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "api-key": env.azureOpenAIKey as string },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              'Convert the subscriber\'s natural-language call preferences into a JSON array of {"description":string,"callType":string,"action":"connect"|"ask"|"notify"|"voicemail"|"decline"}. Respond only with minified JSON.',
          },
          { role: "user", content: input },
        ],
        temperature: 0.1,
        max_tokens: 400,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function parsePreferences(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const input = validateText(body.input, "input");

    const azureRules = await tryAzureParse(input);
    const rules = azureRules ?? deterministicParse(input);
    return jsonResponse(200, { rules, source: azureRules ? "azure" : "simulation" }, correlationId);
  } catch (err) {
    context.error("parsePreferences failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("parsePreferences", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "parse-preferences",
  handler: parsePreferences,
});
