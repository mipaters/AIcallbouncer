import { randomUUID } from "node:crypto";
import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { isCallStorageConfigured, readEnv } from "./env";

const AUDIO_CONTAINER = "concierge-tts-audio";
const SAS_VALID_MINUTES = 60;

function parseAccountCredentialsFromConnectionString(connectionString: string): { accountName: string; accountKey: string } | null {
  const accountNameMatch = connectionString.match(/AccountName=([^;]+)/i);
  const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/i);
  if (!accountNameMatch || !accountKeyMatch) return null;
  return { accountName: accountNameMatch[1], accountKey: accountKeyMatch[1] };
}

/**
 * Uploads synthesized TTS audio bytes to Blob Storage and returns a
 * short-lived SAS URL that Twilio's <Play> verb can fetch directly. Returns
 * null if Azure Storage is not configured or the upload fails, so callers
 * fall back to Twilio's built-in <Say> voice.
 */
export async function uploadAudioAndGetSasUrl(audio: Buffer, contentType = "audio/mpeg"): Promise<string | null> {
  const env = readEnv();
  if (!isCallStorageConfigured(env)) return null;

  try {
    const connectionString = env.azureStorageConnectionString as string;
    const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = serviceClient.getContainerClient(AUDIO_CONTAINER);
    await containerClient.createIfNotExists();

    const blobName = `${randomUUID()}.mp3`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(audio, { blobHTTPHeaders: { blobContentType: contentType } });

    const credentials = parseAccountCredentialsFromConnectionString(connectionString);
    if (!credentials) return blockBlobClient.url; // best-effort: container may already allow anonymous read

    const sharedKeyCredential = new StorageSharedKeyCredential(credentials.accountName, credentials.accountKey);
    const expiresOn = new Date(Date.now() + SAS_VALID_MINUTES * 60 * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: AUDIO_CONTAINER,
        blobName,
        permissions: BlobSASPermissions.parse("r"),
        expiresOn,
      },
      sharedKeyCredential,
    ).toString();

    return `${blockBlobClient.url}?${sas}`;
  } catch {
    return null;
  }
}
