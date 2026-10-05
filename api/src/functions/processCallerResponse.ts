import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { resolveCallerAnalysis } from "../shared/azureOpenAI";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateBoolean, validateText, ValidationError } from "../shared/validation";

export async function processCallerResponse(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const text = validateText(body.text, "text");
    const recognized = validateBoolean(body.recognized, "recognized", false);

    const result = await resolveCallerAnalysis(text, recognized);
    return jsonResponse(200, result, correlationId);
  } catch (err) {
    context.error("processCallerResponse failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("processCallerResponse", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "process-caller-response",
  handler: processCallerResponse,
});
