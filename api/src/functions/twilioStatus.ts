import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseTwilioFormBody, validateTwilioRequest } from "../shared/twilioHelpers";
import { getCall, saveCall } from "../shared/callStore";

const TERMINAL_STATUSES = new Set(["completed", "busy", "failed", "no-answer", "canceled"]);

/**
 * Twilio status callback: reports call lifecycle events (ringing,
 * in-progress, completed, etc). Used here to finalize the live call record
 * once the call truly ends (e.g. after a <Dial> hangs up), so the frontend
 * stops polling it as "in progress".
 */
export async function twilioStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const params = await parseTwilioFormBody(request);
  const { valid, skipped, debugUrl } = await validateTwilioRequest(request, params, "/api/twilio/status");
  if (!valid) {
    context.warn("twilioStatus: invalid Twilio signature", { debugUrl });
    return { status: 403, body: "Invalid signature" };
  }
  if (skipped) {
    context.warn("twilioStatus: Twilio signature validation skipped (TWILIO_AUTH_TOKEN / PUBLIC_BASE_URL not configured)");
  }

  const callSid = params.CallSid ?? "unknown";
  const callStatus = (params.CallStatus ?? params.DialCallStatus ?? "").toLowerCase();
  const now = new Date().toISOString();

  const record = await getCall(callSid);
  if (record && TERMINAL_STATUSES.has(callStatus)) {
    record.status = "completed";
    record.endedReason = record.endedReason ?? callStatus;
    record.updatedAt = now;
    await saveCall(record);
  }

  // When invoked as a <Dial> action callback, Twilio expects a TwiML
  // response (even if empty) to know whether to continue the call;
  // an empty <Response/> simply ends the call here, which is correct
  // once the dialed leg has completed.
  return { status: 200, headers: { "Content-Type": "text/xml" }, body: "<Response></Response>" };
}

app.http("twilioStatus", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "twilio/status",
  handler: twilioStatus,
});
