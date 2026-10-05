import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { isAzureOpenAIConfigured, isAzureSpeechConfigured, isCallStorageConfigured, isTwilioValidationConfigured, readEnv } from "../shared/env";
import { jsonResponse } from "../shared/http";

export async function demoStatus(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const env = readEnv();
  const openAIConfigured = isAzureOpenAIConfigured(env);
  const speechConfigured = isAzureSpeechConfigured(env);
  const realCallsConfigured = isCallStorageConfigured(env);
  const twilioValidationConfigured = isTwilioValidationConfigured(env);

  const mode = openAIConfigured && speechConfigured ? "connected" : openAIConfigured || speechConfigured ? "partial" : "simulation";

  const message =
    mode === "connected"
      ? "Azure OpenAI and Azure Speech are configured. Concierge AI is running in Connected Mode."
      : mode === "partial"
        ? "Some Azure AI services are configured. Concierge AI is running in Partial Mode — unconfigured capabilities fall back to simulation."
        : "Azure AI services are not configured. Concierge AI is running in Simulation Mode with deterministic, scripted responses.";

  return jsonResponse(200, {
    mode,
    azureOpenAIConfigured: openAIConfigured,
    azureSpeechConfigured: speechConfigured,
    realCallsConfigured,
    twilioValidationConfigured,
    message,
  });
}

app.http("demoStatus", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "demo-status",
  handler: demoStatus,
});
