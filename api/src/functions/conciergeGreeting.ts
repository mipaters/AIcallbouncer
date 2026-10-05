import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateText, ValidationError } from "../shared/validation";
import { isCallStorageConfigured } from "../shared/env";
import { getGreeting, setGreeting } from "../shared/callStore";

export const DEFAULT_GREETING =
  "Hello, you've reached Concierge AI, screening calls on behalf of the subscriber. Who's calling, and what is this regarding?";

const MAX_GREETING_LENGTH = 500;

/**
 * GET/PUT the greeting Concierge AI speaks at the start of every screened
 * real call. Configured from the Live Calls page so the presenter can
 * customize it without redeploying.
 */
export async function conciergeGreeting(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    if (!isCallStorageConfigured()) {
      return jsonResponse(
        200,
        { configured: false, greeting: DEFAULT_GREETING, message: "AZURE_STORAGE_CONNECTION_STRING is not configured; the greeting cannot be customized." },
        correlationId,
      );
    }

    if (request.method === "GET") {
      const greeting = (await getGreeting()) ?? DEFAULT_GREETING;
      return jsonResponse(200, { configured: true, greeting }, correlationId);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const greeting = validateText(body.greeting, "greeting");
    if (greeting.length > MAX_GREETING_LENGTH) {
      throw new ValidationError(`greeting must be ${MAX_GREETING_LENGTH} characters or fewer.`);
    }
    await setGreeting(greeting);
    return jsonResponse(200, { configured: true, greeting }, correlationId);
  } catch (err) {
    context.error("conciergeGreeting failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("conciergeGreeting", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "concierge-greeting",
  handler: conciergeGreeting,
});
