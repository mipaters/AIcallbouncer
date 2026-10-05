import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseTwilioFormBody, speak, twiml, validateTwilioRequest } from "../shared/twilioHelpers";
import { resolveCallerAnalysis } from "../shared/azureOpenAI";
import { getCall, getForwardingNumber, saveCall, type LiveCallRecord } from "../shared/callStore";

const NO_FORWARDING_NUMBER_MESSAGE =
  "I'd like to connect you, but no forwarding number has been configured for this demo yet. Please leave a message instead.";

/**
 * Twilio webhook invoked after each <Gather input="speech"> completes.
 * Twilio has already transcribed the caller's speech (SpeechResult) using
 * its own speech recognition; this function runs that text through the
 * Concierge AI decision engine (Azure OpenAI if configured, deterministic
 * fallback otherwise) and branches the call accordingly.
 */
export async function twilioGather(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const params = await parseTwilioFormBody(request);
  const { valid, skipped, debugUrl } = await validateTwilioRequest(request, params, "/api/twilio/gather");
  if (!valid) {
    context.warn("twilioGather: invalid Twilio signature", { debugUrl });
    return { status: 403, body: "Invalid signature" };
  }
  if (skipped) {
    context.warn("twilioGather: Twilio signature validation skipped (TWILIO_AUTH_TOKEN / PUBLIC_BASE_URL not configured)");
  }

  const callSid = params.CallSid ?? "unknown";
  const callerText = (params.SpeechResult ?? "").trim();
  const now = new Date().toISOString();

  const record = await getCall(callSid);
  const response = new twiml.VoiceResponse();

  if (!record) {
    context.warn("twilioGather: no call record found for callSid", { callSid });
    await speak(response, "Sorry, something went wrong tracking this call. Goodbye.");
    response.hangup();
    return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
  }

  if (!callerText) {
    await speak(response, "Sorry, I didn't catch that. Could you repeat who's calling and why?");
    response.gather({ input: ["speech"], action: "/api/twilio/gather", method: "POST", speechTimeout: "auto", speechModel: "phone_call" });
    response.say({ voice: "Polly.Joanna" }, "I still didn't hear anything. Goodbye.");
    response.hangup();
    record.updatedAt = now;
    await saveCall(record);
    return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
  }

  record.transcript.push({ speaker: "caller", text: callerText, timestamp: now });

  // Real inbound callers are never matched against the client-side demo
  // trusted-callers list (that list only exists in the browser's session
  // storage). This is a documented limitation — see README.
  const decision = await resolveCallerAnalysis(callerText, false);
  record.latestDecision = decision;

  let aiLine: string;

  switch (decision.recommendedDisposition) {
    case "connect": {
      const forwardingNumber = await getForwardingNumber();
      if (forwardingNumber) {
        aiLine = "Thank you. Connecting you now.";
        record.status = "connecting";
        record.transcript.push({ speaker: "ai", text: aiLine, timestamp: now });
        record.updatedAt = now;
        await saveCall(record);
        await speak(response, aiLine);
        response.dial({ action: "/api/twilio/status", method: "POST" }, forwardingNumber);
        return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
      }
      aiLine = NO_FORWARDING_NUMBER_MESSAGE;
      record.status = "recording";
      record.transcript.push({ speaker: "ai", text: aiLine, timestamp: now });
      record.updatedAt = now;
      await saveCall(record);
      await speak(response, aiLine);
      response.record({
        action: "/api/twilio/transcription",
        method: "POST",
        transcribe: true,
        transcribeCallback: "/api/twilio/transcription",
        maxLength: 120,
        playBeep: true,
      });
      response.hangup();
      return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
    }

    case "ask": {
      aiLine = decision.suggestedFollowUpQuestion || "Could you tell me a bit more about the reason for your call?";
      record.transcript.push({ speaker: "ai", text: aiLine, timestamp: now });
      record.updatedAt = now;
      await saveCall(record);
      await speak(response, aiLine);
      response.gather({ input: ["speech"], action: "/api/twilio/gather", method: "POST", speechTimeout: "auto", speechModel: "phone_call" });
      response.say({ voice: "Polly.Joanna" }, "I didn't hear a response. Goodbye.");
      response.hangup();
      return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
    }

    case "decline": {
      aiLine = "Thank you for calling, but the subscriber is not accepting this type of call right now. Goodbye.";
      record.status = "completed";
      record.endedReason = "declined";
      record.transcript.push({ speaker: "ai", text: aiLine, timestamp: now });
      record.updatedAt = now;
      await saveCall(record);
      await speak(response, aiLine);
      response.hangup();
      return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
    }

    case "block": {
      aiLine = "I can't assist with that request. This call will now end.";
      record.status = "completed";
      record.endedReason = "blocked-high-risk";
      record.transcript.push({ speaker: "ai", text: aiLine, timestamp: now });
      record.updatedAt = now;
      await saveCall(record);
      await speak(response, aiLine);
      response.hangup();
      return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
    }

    case "notify":
    case "voicemail":
    default: {
      aiLine = "Thank you. Please leave your message after the tone, and I'll pass it along.";
      record.status = "recording";
      record.transcript.push({ speaker: "ai", text: aiLine, timestamp: now });
      record.updatedAt = now;
      await saveCall(record);
      await speak(response, aiLine);
      response.record({
        action: "/api/twilio/transcription",
        method: "POST",
        transcribe: true,
        transcribeCallback: "/api/twilio/transcription",
        maxLength: 120,
        playBeep: true,
      });
      response.hangup();
      return { status: 200, headers: { "Content-Type": "text/xml" }, body: response.toString() };
    }
  }
}

app.http("twilioGather", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "twilio/gather",
  handler: twilioGather,
});
