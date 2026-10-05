import twilio from "twilio";
import type { HttpRequest } from "@azure/functions";
import { isTwilioValidationConfigured, readEnv } from "./env";
import { synthesizeSpeechToMp3 } from "./azureSpeechTts";
import { uploadAudioAndGetSasUrl } from "./audioStorage";

const { twiml } = twilio;

/**
 * Validates that an inbound webhook request actually came from Twilio.
 * Requires TWILIO_AUTH_TOKEN and PUBLIC_BASE_URL to be configured.
 *
 * The URL Twilio signed is reconstructed from PUBLIC_BASE_URL + a known,
 * hardcoded public path (e.g. "/api/twilio/voice") rather than derived from
 * the Function's own `request.url`. Azure Static Web Apps' managed-Functions
 * proxy can present the Function runtime with an internal URL whose path
 * doesn't reliably match the public-facing path Twilio actually called
 * (e.g. with or without the "/api" prefix), which made signature validation
 * fail even for genuine Twilio requests. Using the caller-supplied public
 * path removes that ambiguity entirely.
 *
 * If TWILIO_AUTH_TOKEN/PUBLIC_BASE_URL are unset, validation is skipped
 * (fails open, logged by the caller) so the demo works before those
 * settings are configured.
 */
export async function validateTwilioRequest(
  request: HttpRequest,
  params: Record<string, string>,
  publicPath: string,
): Promise<{ valid: boolean; skipped: boolean; debugUrl?: string }> {
  const env = readEnv();
  if (!isTwilioValidationConfigured(env)) return { valid: true, skipped: true };

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const base = (env.publicBaseUrl as string).replace(/\/+$/, "");
  const url = `${base}${publicPath}`;
  const valid = twilio.validateRequest(env.twilioAuthToken as string, signature, url, params);
  return { valid, skipped: false, debugUrl: url };
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
