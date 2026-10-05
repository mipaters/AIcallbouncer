import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { analyzeCallerTextDeterministic } from "../shared/decisionEngine";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateBoolean, validateText, ValidationError } from "../shared/validation";

/**
 * Risk assessment uses the deterministic signal-detection logic directly
 * (rather than a model call) so that risk flags are always explainable and
 * reproducible for the demo, matching the "Validate all model responses"
 * requirement.
 */
export async function analyzeRisk(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const transcript = validateText(body.transcript, "transcript");
    const recognized = validateBoolean(body.recognized, "recognized", false);

    const result = analyzeCallerTextDeterministic(transcript, recognized);
    return jsonResponse(
      200,
      {
        riskLevel: result.riskLevel,
        riskSignals: result.riskSignals,
        requiresImmediateTermination: result.requiresImmediateTermination,
        disclaimer: result.disclaimer,
      },
      correlationId,
    );
  } catch (err) {
    context.error("analyzeRisk failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("analyzeRisk", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "analyze-risk",
  handler: analyzeRisk,
});
