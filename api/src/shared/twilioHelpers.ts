import twilio from "twilio";
import type { HttpRequest } from "@azure/functions";
import { isTwilioValidationConfigured, readEnv } from "./env";
import { synthesizeSpeechToMp3 } from "./azureSpeechTts";
import { uploadAudioAndGetSasUrl } from "./audioStorage";

const { twiml } = twilio;

/**
 * Validates that an inbound webhook request actually came from Twilio.
 * Requires TWILIO_AUTH_TOKEN and PUBLIC_BASE_URL to be configured (the
 * request is reconstructed against the public base URL rather than trusting
 * the internal Functions request URL, which may differ behind the Static
 * Web Apps proxy). If either is missing, validation is skipped and a
 * warning is returned so the caller can log it — this keeps the demo usable
 * before those settings are configured, but should not be relied on in
 * production.
 */
export async function validateTwilioRequest(
  request: HttpRequest,
  params: Record<string, string>,
): Promise<{ valid: boolean; skipped: boolean }> {
  const env = readEnv();
  if (!isTwilioValidationConfigured(env)) return { valid: true, skipped: true };

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = `${env.publicBaseUrl}${new URL(request.url).pathname}`;
  const valid = twilio.validateRequest(env.twilioAuthToken as string, signature, url, params);
  return { valid, skipped: false };
}

/** Parses a Twilio form-encoded webhook body into a plain string map. */
export async function parseTwilioFormBody(request: HttpRequest): Promise<Record<string, string>> {
  const form = await request.formData();
  const result: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    result[key] = typeof value === "string" ? value : "";
  }
  return result;
}

/**
 * Adds a spoken line to a TwiML response: uses Azure Speech neural TTS when
 * configured, uploading the synthesized audio to Blob Storage and playing
 * it back; otherwise falls back to Twilio's built-in <Say> voice so the
 * call always proceeds.
 */
export async function speak(response: InstanceType<typeof twiml.VoiceResponse>, text: string): Promise<void> {
  const audio = await synthesizeSpeechToMp3(text);
  const url = audio ? await uploadAudioAndGetSasUrl(audio) : null;
  if (url) {
    response.play(url);
  } else {
    response.say({ voice: "Polly.Joanna" }, text);
  }
}

export { twiml };
