import { TableClient } from "@azure/data-tables";
import { isCallStorageConfigured, readEnv } from "./env";
import type { DecisionResult } from "./decisionEngine";

const CALLS_TABLE = "ConciergeCalls";
const SETTINGS_TABLE = "ConciergeSettings";
const CALLS_PARTITION = "call";
const SETTINGS_PARTITION = "settings";
const FORWARDING_NUMBER_ROW = "forwardingNumber";
const GREETING_ROW = "greeting";
const APPROVED_NUMBERS_ROW = "approvedNumbers";

export interface TranscriptLine {
  speaker: "caller" | "ai";
  text: string;
  timestamp: string;
}

export type LiveCallStatus = "in-progress" | "connecting" | "recording" | "completed" | "failed";

export interface LiveCallRecord {
  callSid: string;
  fromMasked: string;
  toMasked: string;
  status: LiveCallStatus;
  startedAt: string;
  updatedAt: string;
  transcript: TranscriptLine[];
  latestDecision?: DecisionResult;
  voicemailTranscript?: string;
  endedReason?: string;
}

let tableClientsReady = false;

function getTableClient(tableName: string): TableClient | null {
  const env = readEnv();
  if (!isCallStorageConfigured(env)) return null;
  return TableClient.fromConnectionString(env.azureStorageConnectionString as string, tableName, {
    allowInsecureConnection: true,
  });
}

async function ensureTablesExist(): Promise<void> {
  if (tableClientsReady) return;
  const calls = getTableClient(CALLS_TABLE);
  const settings = getTableClient(SETTINGS_TABLE);
  if (!calls || !settings) return;
  await Promise.all([
    calls.createTable().catch(() => undefined),
    settings.createTable().catch(() => undefined),
  ]);
  tableClientsReady = true;
}

/** Masks all but the last 2 digits of a phone number before it is ever persisted or logged. */
export function maskPhoneNumber(value: string | undefined | null): string {
  if (!value) return "Unknown";
  return value.replace(/\d(?=\d{2})/g, "\u2022");
}

export async function saveCall(record: LiveCallRecord): Promise<void> {
  const client = getTableClient(CALLS_TABLE);
  if (!client) return;
  await ensureTablesExist();
  await client.upsertEntity(
    {
      partitionKey: CALLS_PARTITION,
      rowKey: record.callSid,
      data: JSON.stringify(record),
      updatedAt: record.updatedAt,
    },
    "Replace",
  );
}

export async function getCall(callSid: string): Promise<LiveCallRecord | null> {
  const client = getTableClient(CALLS_TABLE);
  if (!client) return null;
  await ensureTablesExist();
  try {
    const entity = await client.getEntity<{ data: string }>(CALLS_PARTITION, callSid);
    return JSON.parse(entity.data) as LiveCallRecord;
  } catch {
    return null;
  }
}

export async function listRecentCalls(limit = 25): Promise<LiveCallRecord[]> {
  const client = getTableClient(CALLS_TABLE);
  if (!client) return [];
  await ensureTablesExist();
  const records: LiveCallRecord[] = [];
  try {
    const iter = client.listEntities<{ data: string }>({ queryOptions: { filter: `PartitionKey eq '${CALLS_PARTITION}'` } });
    for await (const entity of iter) {
      records.push(JSON.parse(entity.data) as LiveCallRecord);
    }
  } catch {
    return [];
  }
  records.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  return records.slice(0, limit);
}

export async function getForwardingNumber(): Promise<string | null> {
  const client = getTableClient(SETTINGS_TABLE);
  if (!client) return null;
  await ensureTablesExist();
  try {
    const entity = await client.getEntity<{ value: string }>(SETTINGS_PARTITION, FORWARDING_NUMBER_ROW);
    return entity.value || null;
  } catch {
    return null;
  }
}

export async function setForwardingNumber(number: string): Promise<void> {
  const client = getTableClient(SETTINGS_TABLE);
  if (!client) throw new Error("Call storage is not configured (AZURE_STORAGE_CONNECTION_STRING missing).");
  await ensureTablesExist();
  await client.upsertEntity(
    { partitionKey: SETTINGS_PARTITION, rowKey: FORWARDING_NUMBER_ROW, value: number },
    "Replace",
  );
}

/** Returns the customized greeting, or null if none has been saved (caller should fall back to a default). */
export async function getGreeting(): Promise<string | null> {
  const client = getTableClient(SETTINGS_TABLE);
  if (!client) return null;
  await ensureTablesExist();
  try {
    const entity = await client.getEntity<{ value: string }>(SETTINGS_PARTITION, GREETING_ROW);
    return entity.value || null;
  } catch {
    return null;
  }
}

export async function setGreeting(greeting: string): Promise<void> {
  const client = getTableClient(SETTINGS_TABLE);
  if (!client) throw new Error("Call storage is not configured (AZURE_STORAGE_CONNECTION_STRING missing).");
  await ensureTablesExist();
  await client.upsertEntity(
    { partitionKey: SETTINGS_PARTITION, rowKey: GREETING_ROW, value: greeting },
    "Replace",
  );
}

/** Strips formatting so phone numbers can be compared regardless of minor format differences (e.g. a missing country code). */
export function normalizePhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-10) || digits;
}

export async function getApprovedNumbers(): Promise<string[]> {
  const client = getTableClient(SETTINGS_TABLE);
  if (!client) return [];
  await ensureTablesExist();
  try {
    const entity = await client.getEntity<{ value: string }>(SETTINGS_PARTITION, APPROVED_NUMBERS_ROW);
    const parsed = JSON.parse(entity.value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setApprovedNumbers(numbers: string[]): Promise<void> {
  const client = getTableClient(SETTINGS_TABLE);
  if (!client) throw new Error("Call storage is not configured (AZURE_STORAGE_CONNECTION_STRING missing).");
  await ensureTablesExist();
  await client.upsertEntity(
    { partitionKey: SETTINGS_PARTITION, rowKey: APPROVED_NUMBERS_ROW, value: JSON.stringify(numbers) },
    "Replace",
  );
}

export async function isApprovedNumber(fromNumber: string | undefined | null): Promise<boolean> {
  if (!fromNumber) return false;
  const approved = await getApprovedNumbers();
  if (approved.length === 0) return false;
  const normalizedFrom = normalizePhoneNumber(fromNumber);
  return approved.some((n) => normalizePhoneNumber(n) === normalizedFrom);
}
