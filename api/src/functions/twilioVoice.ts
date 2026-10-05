import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseTwilioFormBody, speak, twiml, validateTwilioRequest } from "../shared/twilioHelpers";
import { getCall, getForwardingNumber, getGreeting, isApprovedNumber, maskPhoneNumber, saveCall, type LiveCallRecord } from "../shared/callStore";
import { DEFAULT_GREETING } from "./conciergeGreeting";

/**
 * Twilio Voice webhook: the entry point configured on your Twilio phone
 * number ("A call comes in" -> Webhook -> POST). Starts tracking the live
 * call. If the caller's number is on the approved list, it connects
 * directly without screening; otherwise it greets the caller and gathers
 * their spoken response.
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

  const response = new twiml.VoiceResponse();

  if (await isApprovedNumber(params.From)) {
    const forwardingNumber = await getForwardingNumber();
    if (forwardingNumber) {
      const line = "You're on the approved caller list. Connecting you now.";
      record.status = "connecting";
      record.endedReason = "approved-bypass";
      record.transcript.push({ speaker: "ai", text: line, timestamp: now });
      record.updatedAt = now;
      await saveCall(record);
      await speak(response, line);
      response.dial({ action: "/api/twilio/status", method: "POST" }, forwardingNumber);
      return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
    }
    context.warn("twilioVoice: approved caller but no forwarding number configured", { callSid });
  }

  const greeting = (await getGreeting()) ?? DEFAULT_GREETING;
  record.transcript.push({ speaker: "ai", text: greeting, timestamp: now });
  record.updatedAt = now;
  await saveCall(record);

  await speak(response, greeting);
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
