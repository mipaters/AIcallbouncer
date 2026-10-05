import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseTwilioFormBody, speak, twiml, validateTwilioRequest } from "../shared/twilioHelpers";
import { getCall, maskPhoneNumber, saveCall, type LiveCallRecord } from "../shared/callStore";

const GREETING = "Hello, you've reached Concierge AI, screening calls on behalf of the subscriber. Who's calling, and what is this regarding?";

/**
 * Twilio Voice webhook: the entry point configured on your Twilio phone
 * number ("A call comes in" -> Webhook -> POST). Starts tracking the live
 * call and greets the caller, then gathers their spoken response.
 */
export async function twilioVoice(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const params = await parseTwilioFormBody(request);
  const { valid, skipped, debugUrl } = await validateTwilioRequest(request, params, "/api/twilio/voice");
  if (!valid) {
    context.warn("twilioVoice: invalid Twilio signature", { debugUrl });
    return { status: 403, body: "Invalid signature" };
  }
  if (skipped) {
    context.warn("twilioVoice: Twilio signature validation skipped (TWILIO_AUTH_TOKEN / PUBLIC_BASE_URL not configured)");
  }

  const callSid = params.CallSid ?? "unknown";
  const now = new Date().toISOString();

  const existing = await getCall(callSid);
  const record: LiveCallRecord = existing ?? {
    callSid,
    fromMasked: maskPhoneNumber(params.From),
    toMasked: maskPhoneNumber(params.To),
    status: "in-progress",
    startedAt: now,
    updatedAt: now,
    transcript: [],
  };

  record.transcript.push({ speaker: "ai", text: GREETING, timestamp: now });
  record.updatedAt = now;
  await saveCall(record);

  const response = new twiml.VoiceResponse();
  await speak(response, GREETING);
  response.gather({
    input: ["speech"],
    action: "/api/twilio/gather",
    method: "POST",
    speechTimeout: "auto",
    speechModel: "phone_call",
  });
  // If no speech is captured, Twilio falls through to here.
  response.say({ voice: "Polly.Joanna" }, "I didn't hear a response. Goodbye.");
  response.hangup();

  return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
}

app.http("twilioVoice", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "twilio/voice",
  handler: twilioVoice,
});
