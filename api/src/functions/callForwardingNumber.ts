import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse, errorResponse } from "../shared/http";
import { newCorrelationId, validateText, ValidationError } from "../shared/validation";
import { isCallStorageConfigured } from "../shared/env";
import { getForwardingNumber, setForwardingNumber } from "../shared/callStore";

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * GET/PUT the real phone number Concierge AI dials when a live call is
 * recommended for "Connect". Configured from the Demo Settings page rather
 * than as a Function App setting, since the spec calls for this to be
 * something the presenter can set directly in the demo.
 */
export async function callForwardingNumber(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    if (!isCallStorageConfigured()) {
      return jsonResponse(
        200,
        { configured: false, number: null, message: "AZURE_STORAGE_CONNECTION_STRING is not configured; real-call forwarding is unavailable." },
        correlationId,
      );
    }

    if (request.method === "GET") {
      const number = await getForwardingNumber();
      return jsonResponse(200, { configured: true, number }, correlationId);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const number = validateText(body.number, "number");
    if (!E164_PATTERN.test(number)) {
      throw new ValidationError("number must be in E.164 format, e.g. +12895551234.");
    }
    await setForwardingNumber(number);
    return jsonResponse(200, { configured: true, number }, correlationId);
  } catch (err) {
    context.error("callForwardingNumber failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("callForwardingNumber", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "call-forwarding-number",
  handler: callForwardingNumber,
});
