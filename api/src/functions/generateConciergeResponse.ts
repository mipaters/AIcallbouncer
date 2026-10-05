import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { resolveCallerAnalysis } from "../shared/azureOpenAI";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateBoolean, validateText, ValidationError } from "../shared/validation";

/**
 * Generates the next Concierge AI reply. In Connected Mode this is derived
 * from the Azure OpenAI structured decision; in Simulation Mode it falls
 * back to a deterministic, explainable reply built from the same decision
 * fields.
 */
export async function generateConciergeResponse(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const callerText = validateText(body.callerText, "callerText");
    const recognized = validateBoolean(body.recognized, "recognized", false);

    const decision = await resolveCallerAnalysis(callerText, recognized);

    let reply: string;
    if (decision.requiresImmediateTermination) {
      reply = "I cannot assist with that request. This call will now end.";
    } else if (decision.suggestedFollowUpQuestion) {
      reply = decision.suggestedFollowUpQuestion;
    } else if (decision.recommendedDisposition === "decline") {
      reply = "Thank you, but that is not something the subscriber is accepting at this time.";
    } else {
      reply = "Thank you. I'll pass this along right away.";
    }

    return jsonResponse(200, { reply, decision }, correlationId);
  } catch (err) {
    context.error("generateConciergeResponse failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("generateConciergeResponse", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "generate-concierge-response",
  handler: generateConciergeResponse,
});
