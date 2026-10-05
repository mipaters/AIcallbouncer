import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, ValidationError } from "../shared/validation";
import { isCallStorageConfigured } from "../shared/env";
import { listRecentCalls } from "../shared/callStore";

/**
 * Returns recent real (Twilio) calls so the frontend can poll for live
 * updates while a call is in progress. Short-interval polling is used
 * instead of a push channel (e.g. SignalR) to keep the demo's
 * infrastructure footprint small; see README for details.
 */
export async function liveCalls(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    if (!isCallStorageConfigured()) {
      return jsonResponse(200, { configured: false, calls: [] }, correlationId);
    }
    const calls = await listRecentCalls(25);
    return jsonResponse(200, { configured: true, calls }, correlationId);
  } catch (err) {
    context.error("liveCalls failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("liveCalls", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "live-calls",
  handler: liveCalls,
});
