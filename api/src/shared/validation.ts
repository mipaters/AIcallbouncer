import { randomUUID } from "node:crypto";

export function newCorrelationId(): string {
  return randomUUID();
}

const MAX_TEXT_LENGTH = 4000;

/** Validate and sanitize free-form text input from the client. */
export function validateText(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${fieldName} must not be empty.`);
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`${fieldName} exceeds the maximum allowed length.`);
  }
  return trimmed;
}

export function validateBoolean(value: unknown, fieldName: string, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") {
    throw new ValidationError(`${fieldName} must be a boolean.`);
  }
  return value;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Mask all but the last 2 digits of a phone number before any logging. */
export function maskPhoneNumber(value: string): string {
  return value.replace(/\d(?=\d{2})/g, "•");
}
