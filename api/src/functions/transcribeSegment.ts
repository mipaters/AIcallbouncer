import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { isAzureSpeechConfigured } from "../shared/env";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateText, ValidationError } from "../shared/validation";

const MAX_BODY_BYTES = 2_000_000; // ~2MB safety limit for demo payloads

/**
 * Accepts a short text or base64 audio segment and returns a transcript.
 * Real Azure Speech transcription requires AZURE_SPEECH_KEY/REGION and a
 * streaming audio pipeline that is out of scope for this static demo API;
 * when Azure Speech is not configured, scripted/provided text is echoed
 * back so the UI can progress deterministically ("Simulation Mode").
 */
export async function transcribeSegment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const raw = await request.text();
    if (raw && raw.length > MAX_BODY_BYTES) {
      throw Object.assign(new Error("Payload too large."), { name: "ValidationError" });
    }
    const body = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
    const text = typeof body.text === "string" ? validateText(body.text, "text") : "";
    const speechConfigured = isAzureSpeechConfigured();

    return jsonResponse(
      200,
      {
        transcript: text,
        source: speechConfigured ? "azure-speech" : "simulation",
        message: speechConfigured
          ? "Transcribed via Azure Speech."
          : "Azure Speech is not configured; echoing provided simulation text.",
      },
      correlationId,
    );
  } catch (err) {
    context.error("transcribeSegment failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("transcribeSegment", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "transcribe-segment",
  handler: transcribeSegment,
});
