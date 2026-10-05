# Rogers Doorperson AI — Executive Demo

> **⚠️ Synthetic, illustrative demo only.** All call scenarios, caller names, phone
> numbers, and transcripts in this project are fictional and created for a product
> walkthrough. Nothing in this repository places real phone calls, stores real
> personal data, or connects to telephony infrastructure. No real Rogers product,
> customer data, or call data is used anywhere in this app.

A mobile-first React + TypeScript single-page app that simulates "Doorperson AI" —
an AI assistant that screens incoming calls on a subscriber's behalf, explains its
reasoning, and routes callers to **Connect**, **Ask the subscriber**, **Take a
message**, **Voicemail**, **Decline**, or **Hang up (abuse/scam)**. It is built as
an executive-facing, click-through demo: every flow is fully scripted and
deterministic, with an optional "Connected Mode" that calls Azure OpenAI / Azure
Speech if credentials are supplied, and a built-in Simulation Mode that works with
zero configuration.

---

## 1. What's included

| Area | Description |
|---|---|
| **Frontend** (`src/`) | Vite + React 19 + TypeScript PWA. Bottom nav on mobile, nav rail on desktop. |
| **Live Demo** (`src/pages/LiveDemo.tsx`) | Guided, Interactive-Caller, and Microphone-Simulation modes; 10 scripted scenarios; a 4-part "Executive Demo" auto-sequence. |
| **Decision engine** (`src/engine/decisionEngine.ts`) | Deterministic, explainable caller-text classifier (category, risk, recommended disposition). |
| **Preferences / Trusted Callers** | Natural-language preference parsing UI, per-contact rules, call-type rules editor. |
| **Call History / Call Detail** | Session-only history (sessionStorage) with full reasoning trail and "Delete all history" control. |
| **How It Works / Privacy / Architecture** | Plain-language explainer pages describing data handling and the (illustrative) system architecture. |
| **Azure Functions API** (`api/`) | Optional backend mirroring the client engine; calls Azure OpenAI/Speech when configured, otherwise returns the same deterministic result. |
| **Azure Static Web Apps config** | `staticwebapp.config.json` + `.github/workflows/azure-static-web-apps.yml`. |

---

## 2. Running locally

### Frontend only (Simulation Mode — no Azure account needed)

```powershell
npm install
npm run dev
```

Open the printed local URL. Because no `/api` server is running, every API call
in `src/lib/api.ts` times out after 3.5s and falls back to the local deterministic
engine automatically — the UI still works end-to-end, and the **Architecture**
page / status badges report **Simulation Mode**.

### Frontend + API together (optional)

Requires [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
and the [SWA CLI](https://azure.github.io/static-web-apps-cli/) (or run the two
dev servers separately).

```powershell
# Terminal 1 — API
cd api
npm install
copy local.settings.json.example local.settings.json   # fill in Azure values, or leave blank for Simulation Mode
npm run build
func start

# Terminal 2 — Frontend
npm install
npm run dev
```

Or, with the SWA CLI proxying both:

```powershell
npm install -g @azure/static-web-apps-cli
swa start http://localhost:5173 --api-location api --run "npm run dev"
```

### Type-check / build

```powershell
npx tsc -b --noEmit     # frontend type-check
npm run build            # frontend production build -> dist/
cd api; npm run build    # API build -> api/dist/
```

---

## 3. Connected Mode vs. Simulation Mode

The app never requires Azure credentials to function. Three states exist:

- **Simulation Mode** (default): no `/api` reachable, or Azure env vars unset.
  All reasoning comes from the local deterministic engine (same logic on both
  client and API for consistency). This is what reviewers will see unless they
  explicitly configure Azure.
- **Connected Mode**: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and
  `AZURE_OPENAI_DEPLOYMENT` are all set on the Function App. `POST
  /api/process-caller-response`, `/api/generate-doorperson-response`, and
  `/api/parse-preferences` will call Azure OpenAI with an 8-second timeout and
  validate the shape of the response; any failure (timeout, malformed JSON,
  network error) silently falls back to the deterministic engine so the demo
  never breaks on stage.
- **Error / Partial Mode**: API is reachable but Azure services are
  misconfigured or erroring — `GET /api/demo-status` reports this so the UI can
  show an honest status badge instead of pretending everything is connected.

`/api/analyze-risk` **always** uses the deterministic engine, even in Connected
Mode, so risk scoring stays explainable and reproducible for execs reviewing the
logic.

### Environment variables

See [`.env.example`](./.env.example) and [`api/local.settings.json.example`](./api/local.settings.json.example):

| Variable | Required for | Notes |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | Connected Mode | e.g. `https://<resource>.openai.azure.com` |
| `AZURE_OPENAI_API_KEY` | Connected Mode | Store as a Function App secret, never commit it |
| `AZURE_OPENAI_DEPLOYMENT` | Connected Mode | Your chat-completion deployment name |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | Optional transcription | Only used by `/api/transcribe-segment`; without it, provided text is echoed back |
| `AZURE_STORAGE_CONNECTION_STRING` | Real calls (Twilio) | Full `AccountName=...;AccountKey=...` connection string for an Azure Storage Account (Table + Blob) |
| `TWILIO_AUTH_TOKEN` | Real calls (Twilio) | Used to validate that inbound webhooks really came from Twilio |
| `PUBLIC_BASE_URL` | Real calls (Twilio) | Public HTTPS origin of the deployed app, e.g. `https://kind-rock-0966aa80f.6.azurestaticapps.net` |

No `local.settings.json` or `.env` file is committed to this repository — only
`.example` templates. **Do not commit real keys.**

### Real phone calls via Twilio (optional)

Beyond the scripted demo, the app can screen **real inbound phone calls** to a
Twilio number you control, using the same decision engine:

1. **Create an Azure Storage Account** (general-purpose v2, any region/tier)
   to hold live call state and short-lived TTS audio clips. Copy its
   connection string from **Access keys**.
2. In the Static Web App resource → **Configuration**, add
   `AZURE_STORAGE_CONNECTION_STRING`, `TWILIO_AUTH_TOKEN` (from the Twilio
   Console), and `PUBLIC_BASE_URL` (your deployed site's origin).
3. In the **Twilio Console**, open your phone number's configuration and set
   **"A call comes in"** to a webhook:
   `POST https://<your-site>/api/twilio/voice`
   Optionally set a **Call status changes** webhook to
   `POST https://<your-site>/api/twilio/status`.
4. Open the **Live Calls** page in the app and enter your own phone number
   (E.164 format, e.g. `+12895551234`) as the forwarding number — this is the
   number Doorperson AI dials when it decides to connect a call through to
   you.
5. Call your Twilio number. The **Live Calls** page polls `GET
   /api/live-calls` every ~2 seconds and shows the live transcript and the
   AI's decision as the call progresses.

How it works end to end: Twilio posts the caller's speech-to-text result to
`/api/twilio/gather`, which runs the same `decisionEngine`/Azure OpenAI logic
used by the simulated demo, then returns TwiML that either `<Dial>`s your
forwarding number, asks a clarifying follow-up, politely declines, or records
and transcribes a voicemail. Doorperson AI's spoken responses use Azure Speech
neural TTS (falling back to Twilio's built-in voice if Azure Speech isn't
configured); synthesized audio is stored as a short-lived (60-minute) Blob SAS
URL for Twilio's `<Play>` verb to fetch.

**Known gaps in the real-call path** (see §8 for the full list): the trusted
caller list lives only in the browser, so real callers are never
auto-recognized as trusted; the Live Calls view uses polling rather than a
push/websocket update; and voicemail transcription uses Twilio's own
speech-to-text rather than Azure Speech.

---

## 4. Deploying to Azure Static Web Apps

This repo is linked to an Azure Static Web App resource. When you link a
GitHub repo from the Azure Portal, Azure commits its own workflow file (named
after the resource, e.g. `.github/workflows/azure-static-web-apps-<name>.yml`)
with a deployment token secret already wired up
(`AZURE_STATIC_WEB_APPS_API_TOKEN_<NAME>`) — you do not need to create that
secret yourself. That generated workflow triggers on pushes/PRs to whichever
branch was selected when the resource was created.

If you need to (re)link a repo manually instead:

1. In the Azure Portal, create a **Static Web App** resource, choosing
   **GitHub** as the deployment source and this repository/branch.
2. Set App location: `/`, Api location: `api`, Output location: `dist`
   (the generated workflow defaults `api_location` to `""` — edit it to
   `"api"` so the Azure Functions backend deploys too).
3. In the Static Web App resource → **Configuration**, add the Azure OpenAI /
   Speech application settings listed above if you want Connected Mode in the
   deployed environment. Leave them blank to ship in Simulation Mode.
4. Confirm the deployment: open the generated `*.azurestaticapps.net` URL and
   check the **Architecture** page status badge matches your configuration.

---

## 5. Five-minute executive walkthrough

1. **Home** — read the one-paragraph pitch and tap **Start Executive Demo**.
2. **Part 1 — Everyday convenience (Dental appointment)**: a known, low-risk
   caller is recognized and connected without interruption.
3. **Part 2 — Protecting attention (Delivery driver)**: a legitimate but
   low-priority caller is handled by Doorperson AI without disturbing the
   subscriber.
4. **Part 3 — Saying no, politely (Sales call)**: Doorperson AI declines a cold
   sales call per the subscriber's preferences, and logs why.
5. **Part 4 — Protection from scams (Rogers impersonation)**: Doorperson AI
   detects urgency + payment-demand language, flags high risk, and
   terminates the call — never collecting the caller's information.
6. Open **Call History** to show the full reasoning trail was logged (with
   phone numbers masked), then **Preferences** to show the rules are
   subscriber-editable in plain English, then **Privacy** to reinforce the
   "demo is local, session-only, delete anytime" story.

> **Known simplification:** the spec describes a 5-part Executive Demo where
> Part 1 is a non-interactive "explain the problem" slide. This build
> auto-chains directly through the 4 scenario parts above (renumbered 1–4 in
> the UI); the presenter should narrate the "problem" framing verbally before
> starting the sequence, or an intro slide can be added as a follow-up.

---

## 6. Adding a new scenario

1. Open `src/data/scenarios.ts` and add a new object to the exported array
   matching the `Scenario` type (`src/types.ts`): `id`, `title`, `summary`,
   `category`, an ordered `steps` array (each with `callerLine` and/or
   `doorpersonLine`, optional `understanding` patch, optional `riskSignals`,
   optional `alternateCallerLines` for Interactive Caller mode), and a final
   `disposition` + `presenterNotes`.
2. If the scenario should appear in the Executive Demo sequence, add its `id`
   to `EXECUTIVE_SEQUENCE` in `src/pages/LiveDemo.tsx`.
3. No other wiring is required — the scenario picker, transcript renderer, and
   call-history commit logic all read from this array generically.

---

## 7. Replacing the placeholder icon

`public/icons/icon-192.svg`, `icon-512.svg`, and `public/apple-touch-icon.svg`
are intentionally simple placeholder marks (a red rounded square with a "D").
To replace them:

1. Export your real icon as PNG (recommended, 192×192 and 512×512 — iOS Safari
   does not reliably honor SVG apple-touch-icons) and/or SVG.
2. Replace the files in `public/icons/` (and `public/apple-touch-icon.*` if you
   switch formats), keeping the same file names, or update the references in
   `index.html` and `public/manifest.webmanifest` to match new file names.

---

## 8. Known limitations / honest gaps

- This is a **client-rendered demo with session-only storage** — nothing
  persists across browser sessions or devices, by design (see Privacy page).
- The Azure OpenAI integration is a best-effort convenience call with a
  prompt-engineered JSON contract (not an enforced JSON response_format);
  malformed model output falls back to the deterministic engine rather than
  erroring the UI.
- `/api/transcribe-segment` does not perform live audio capture/streaming to
  Azure Speech; it is a pass-through endpoint intended to demonstrate the
  config-detection and fallback pattern, not full speech-to-text plumbing.
- Microphone simulation relies on the browser's built-in
  `SpeechRecognition`/`webkitSpeechRecognition` API (Chrome/Edge); it never
  auto-starts and always requires an explicit "Start speaking" tap, with a
  visible active-mic indicator and a Stop control, and shows a graceful
  message if unsupported.
- The Executive Demo ships as 4 chained scenario parts rather than the
  5-part structure described in the original spec (see §5 above).
- Phone numbers are masked (all but last 2 digits) everywhere they are
  rendered or logged, both client-side and in the API's validation helpers.
- Real-call support (§3) has its own gaps: the trusted-caller list is
  browser-only and never applies to real Twilio callers; the Live Calls page
  reflects state via ~2-second polling rather than a push channel; voicemail
  transcription is done by Twilio's own speech-to-text, not Azure Speech;
  and Twilio webhook signature validation is skipped (fails open, logged as
  a warning) if `TWILIO_AUTH_TOKEN`/`PUBLIC_BASE_URL` aren't set.

---

## 9. Project structure

```
src/
  types.ts                 Shared domain types
  data/                    Scenarios, preferences, trusted callers, seeded history
  engine/decisionEngine.ts Deterministic classifier (frontend)
  lib/                     api.ts (fetch + fallback), storage.ts (sessionStorage)
  context/DemoContext.tsx  Global app state/session persistence
  components/              Shared UI (Badge, Disclaimer) + AppShell navigation
  pages/                   One file per route
api/
  src/functions/           One Azure Function per /api route (v4 programming model),
                           including twilioVoice/twilioGather/twilioTranscription/
                           twilioStatus, liveCalls, callForwardingNumber
  src/shared/              env.ts, validation.ts, decisionEngine.ts (backend copy),
                           azureOpenAI.ts, http.ts, callStore.ts, twilioHelpers.ts,
                           azureSpeechTts.ts, audioStorage.ts
.github/workflows/         Azure Static Web Apps CI/CD
staticwebapp.config.json   SWA routing/headers
.env.example               Env var template (frontend build)
api/local.settings.json.example  Env var template (Functions local dev)
```

---

## 10. Disclaimer

This repository and everything in it — company name references, call
scenarios, transcripts, phone numbers, and caller identities — is a **fictional,
illustrative product concept created for demonstration purposes only**. It does
not represent a real shipping product, real customer data, or real call-handling
infrastructure.
