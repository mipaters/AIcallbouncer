import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateBoolean, validateText, ValidationError } from "../shared/validation";

const GREETINGS: Record<string, string> = {
  default: "Hello. You've reached Mike's personal call assistant. May I ask who is calling and what this is regarding?",
  concise: "Hello. I'm Mike's call assistant. Who is calling, and how may I help?",
  warm: "Hi there. I'm helping Mike manage incoming calls. May I ask your name and the reason for your call?",
  formal:
    "Hello. This call is being screened by Mike's personal call assistant. Please state your name, organization, and the purpose of your call.",
};

export async function startScreening(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const greetingStyle = typeof body.greetingStyle === "string" ? body.greetingStyle : "default";
    const recognized = validateBoolean(body.recognized, "recognized", false);
    const callerNumberMasked = typeof body.callerNumberMasked === "string" ? validateText(body.callerNumberMasked, "callerNumberMasked") : undefined;

    const greeting = GREETINGS[greetingStyle] ?? GREETINGS.default;

    return jsonResponse(200, {
      greeting,
      recognized,
      callerNumberMasked,
      message: recognized ? "Recognized caller — screening may be skipped per preferences." : "Concierge AI is answering for you.",
    }, correlationId);
  } catch (err) {
    context.error("startScreening failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("startScreening", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "start-screening",
  handler: startScreening,
});
