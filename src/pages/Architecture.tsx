const DEMO_MVP = [
  "React mobile web application",
  "Azure Static Web Apps",
  "Azure Functions",
  "Azure Speech (optional)",
  "Azure OpenAI / Microsoft Foundry model endpoint (optional)",
  "Synthetic callers",
  "Synthetic contacts",
  "Mock incoming-call events",
  "Session-only history",
  "In-app notifications",
];

const FUTURE_INTEGRATION = [
  "Approved voice-network integration — Requires Rogers integration",
  "Incoming-call event — Requires Rogers integration",
  "Caller identification and reputation signals — Requires Rogers integration",
  "Customer-authorized trusted caller list — Requires privacy and regulatory review",
  "Call media or transcription integration — Requires Rogers integration",
  "Concierge AI conversation service — Future concept",
  "Subscriber preference engine — Future concept",
  "Call-routing decision — Requires Rogers integration",
  "Network call disposition — Requires Rogers integration",
  "Subscriber notification — Future concept",
  "Voicemail integration — Requires Rogers integration",
  "Aggregated service insights — Future concept",
];

export function Architecture() {
  return (
    <div>
      <div className="page-title">Architecture</div>
      <p className="page-subtitle">
        This page separates what is implemented in the demo from what a future production integration would require.
      </p>

      <div className="section-title">Implemented in the Demo (MVP)</div>
      <div className="card">
        {DEMO_MVP.map((item) => (
          <div key={item} className="field-row">
            <span className="field-value" style={{ textAlign: "left" }}>
              {item}
            </span>
          </div>
        ))}
      </div>

      <div className="section-title">Future Rogers Integration (Conceptual)</div>
      <div className="card">
        {FUTURE_INTEGRATION.map((item) => (
          <div key={item} className="field-row">
            <span className="field-value" style={{ textAlign: "left" }}>
              {item}
            </span>
          </div>
        ))}
      </div>

      <div className="alert-banner">
        <div className="alert-title">Important</div>
        <p style={{ margin: "6px 0 0" }}>
          This Azure Static Web App cannot intercept real mobile calls. All call-handling shown in this demo is
          simulated end-to-end.
        </p>
      </div>
    </div>
  );
}
