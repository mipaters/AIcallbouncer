import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { resolveCallerAnalysis } from "../shared/azureOpenAI";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateBoolean, validateText, ValidationError } from "../shared/validation";

export async function recommendDisposition(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const transcript = validateText(body.transcript, "transcript");
    const recognized = validateBoolean(body.recognized, "recognized", false);

    const result = await resolveCallerAnalysis(transcript, recognized);
    return jsonResponse(
      200,
      {
        recommendedDisposition: result.recommendedDisposition,
        decisionExplanation: result.decisionExplanation,
        requiresSubscriberApproval: result.requiresSubscriberApproval,
        requiresImmediateTermination: result.requiresImmediateTermination,
        source: result.source,
        disclaimer: result.disclaimer,
      },
      correlationId,
    );
  } catch (err) {
    context.error("recommendDisposition failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("recommendDisposition", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "recommend-disposition",
  handler: recommendDisposition,
});
