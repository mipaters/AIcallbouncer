import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, ValidationError } from "../shared/validation";
import { isCallStorageConfigured } from "../shared/env";
import { getApprovedNumbers, setApprovedNumbers } from "../shared/callStore";

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;
const MAX_APPROVED_NUMBERS = 100;

/**
 * GET/PUT the list of phone numbers that bypass Concierge AI screening
 * entirely on real calls and are connected straight through to the
 * forwarding number. Configured from the Live Calls page.
 */
export async function approvedNumbers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    if (!isCallStorageConfigured()) {
      return jsonResponse(
        200,
        { configured: false, numbers: [], message: "AZURE_STORAGE_CONNECTION_STRING is not configured; approved numbers are unavailable." },
        correlationId,
      );
    }

    if (request.method === "GET") {
      const numbers = await getApprovedNumbers();
      return jsonResponse(200, { configured: true, numbers }, correlationId);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (!Array.isArray(body.numbers)) {
      throw new ValidationError("numbers must be an array of strings.");
    }
    if (body.numbers.length > MAX_APPROVED_NUMBERS) {
      throw new ValidationError(`numbers must contain ${MAX_APPROVED_NUMBERS} entries or fewer.`);
    }
    const numbers = body.numbers.map((n) => String(n).trim());
    for (const n of numbers) {
      if (!E164_PATTERN.test(n)) {
        throw new ValidationError(`"${n}" must be in E.164 format, e.g. +12895551234.`);
      }
    }
    await setApprovedNumbers(numbers);
    return jsonResponse(200, { configured: true, numbers }, correlationId);
  } catch (err) {
    context.error("approvedNumbers failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("approvedNumbers", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "approved-numbers",
  handler: approvedNumbers,
});
