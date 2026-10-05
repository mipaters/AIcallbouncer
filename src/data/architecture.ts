/**
 * Shared source of truth for what's deployed in this demo vs. what a real
 * carrier production deployment (e.g. at Rogers) would require. Used by the
 * standalone Architecture page and the Executive Demo walkthrough.
 */

export const DEMO_DEPLOYMENT = [
  "React PWA front-end on Azure Static Web Apps",
  "Azure Functions API backend",
  "Real inbound calls via a Twilio phone number + webhooks (not a direct carrier network integration)",
  "Azure Table Storage — live call state & demo settings",
  "Azure Blob Storage — short-lived, SAS-expiring text-to-speech audio",
  "Azure Speech — text-to-speech (optional; falls back to Twilio's built-in voice)",
  "Azure OpenAI / Microsoft Foundry model endpoint (optional; deterministic rules engine otherwise)",
  "Synthetic contacts & trusted-caller list (browser session only)",
  "Session-only call history (no durable subscriber database)",
  "In-app notifications only (no SMS/push)",
];

export const PRODUCTION_DEPLOYMENT = [
  "Direct carrier network integration (SIP/IMS call control) in place of a third-party telephony vendor",
  "Subscriber identity & contacts from the carrier's CRM / network directory, not synthetic data",
  "Persistent, secure subscriber preference & call history store, not browser session storage",
  "Carrier-grade caller ID, reputation, and fraud-signal feeds",
  "Enterprise Azure OpenAI deployment with content safety, monitoring, and data-residency controls",
  "Push/SMS subscriber notifications",
  "Multi-tenant scaling, observability, and compliance controls (privacy, call-recording consent per jurisdiction)",
  "Billing & provisioning integration as a premium subscriber add-on service",
];
