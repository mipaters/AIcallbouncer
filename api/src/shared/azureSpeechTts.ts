import { isAzureSpeechConfigured, readEnv } from "./env";

/** Minimal XML-escape for text interpolated into SSML. */
function escapeSsml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const DEFAULT_VOICE = "en-CA-ClaraNeural";

/**
 * Synthesizes speech via the Azure Speech REST TTS endpoint and returns MP3
 * audio bytes. Returns null when Azure Speech is not configured or the call
 * fails for any reason, so callers can gracefully fall back to Twilio's
 * built-in <Say> voice.
 */
export async function synthesizeSpeechToMp3(text: string): Promise<Buffer | null> {
  const env = readEnv();
  if (!isAzureSpeechConfigured(env)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://${env.azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `<speak version="1.0" xml:lang="en-CA"><voice name="${DEFAULT_VOICE}">${escapeSsml(text)}</voice></speak>`;

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Ocp-Apim-Subscription-Key": env.azureSpeechKey as string,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
        "User-Agent": "concierge-ai-demo",
      },
      body: ssml,
    });

    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
