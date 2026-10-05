import type { HttpResponseInit } from "@azure/functions";
import { newCorrelationId } from "./validation";

export function jsonResponse(status: number, body: unknown, correlationId?: string): HttpResponseInit {
  return {
    status,
    jsonBody: { ...(body as object), correlationId: correlationId ?? newCorrelationId() },
    headers: { "Content-Type": "application/json" },
  };
}

/** Converts any thrown error into a safe, generic error response (never leaks internals). */
export function errorResponse(err: unknown, correlationId: string = newCorrelationId()): HttpResponseInit {
  const isValidation = err instanceof Error && err.name === "ValidationError";
  return {
    status: isValidation ? 400 : 500,
    jsonBody: {
      error: isValidation ? (err as Error).message : "An unexpected error occurred while processing the request.",
      correlationId,
    },
    headers: { "Content-Type": "application/json" },
  };
}
