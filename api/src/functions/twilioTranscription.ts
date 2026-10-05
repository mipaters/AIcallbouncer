import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseTwilioFormBody, validateTwilioRequest } from "../shared/twilioHelpers";
import { getCall, saveCall } from "../shared/callStore";

/**
 * Twilio transcription callback: invoked once a voicemail <Record>ing has
 * been transcribed. Twilio performs the speech-to-text for recorded
 * messages; this just stores the result against the live call record.
 */
export async function twilioTranscription(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const params = await parseTwilioFormBody(request);
  const { valid, skipped } = await validateTwilioRequest(request, params);
  if (!valid) {
    context.warn("twilioTranscription: invalid Twilio signature");
    return { status: 403, body: "Invalid signature" };
  }
  if (skipped) {
    context.warn("twilioTranscription: Twilio signature validation skipped (TWILIO_AUTH_TOKEN / PUBLIC_BASE_URL not configured)");
  }

  const callSid = params.CallSid ?? "unknown";
  const transcriptionText = (params.TranscriptionText ?? "").trim();
  const now = new Date().toISOString();

  const record = await getCall(callSid);
  if (record) {
    record.voicemailTranscript = transcriptionText || "(No speech detected in the recording.)";
    record.status = "completed";
    record.endedReason = record.endedReason ?? "voicemail-left";
    record.transcript.push({ speaker: "caller", text: record.voicemailTranscript, timestamp: now });
    record.updatedAt = now;
    await saveCall(record);
  } else {
    context.warn("twilioTranscription: no call record found for callSid", { callSid });
  }

  // This endpoint is called asynchronously by Twilio (transcribeCallback)
  // and also synchronously as the <Record> action; an empty 200 is valid
  // for both cases since no further TwiML verbs are needed.
  return { status: 200, headers: { "Content-Type": "text/xml" }, body: "<Response></Response>" };
}

app.http("twilioTranscription", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "twilio/transcription",
  handler: twilioTranscription,
});
