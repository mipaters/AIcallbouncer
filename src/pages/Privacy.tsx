import { useDemo } from "../context/DemoContext";

const PRIVACY_POINTS = [
  "Concierge AI identifies itself as an AI assistant.",
  "The subscriber opts into the service.",
  "The subscriber controls screening preferences.",
  "Microphone usage requires explicit permission.",
  "The demo uses synthetic contacts and callers.",
  "Audio is not retained in mock mode.",
  "Demo transcripts remain in the current session only.",
  "The subscriber can delete session history at any time.",
  "The assistant does not reveal personal information.",
  "Family and contact data would require explicit permission in production.",
  "Callers can choose to leave a voicemail.",
  "The assistant does not make binding commitments.",
  "Risk assessments may be incomplete or incorrect.",
  "Production use would require legal, privacy, regulatory, security, and telecommunications review.",
];

export function Privacy() {
  const { deleteHistory } = useDemo();

  return (
    <div>
      <div className="page-title">Privacy</div>
      <div className="card">
        {PRIVACY_POINTS.map((p, i) => (
          <div key={i} className="field-row">
            <span className="field-value" style={{ textAlign: "left" }}>
              {p}
            </span>
          </div>
        ))}
      </div>

      <div className="alert-banner">
        <div className="alert-title">Responsible Demo Statement</div>
        <p style={{ margin: "6px 0 0" }}>
          Rogers Concierge AI is an illustrative concept demonstration using synthetic callers, contacts,
          conversations, preferences, and call decisions. It is not connected to Rogers customer, network, voicemail,
          billing, security, or telecommunications systems. The demonstration cannot intercept, answer, route, block,
          or transfer real phone calls. AI-generated summaries and risk assessments may be incomplete or incorrect.
        </p>
      </div>

      <button className="btn btn-solid btn-block" onClick={deleteHistory}>
        Delete demo history
      </button>
    </div>
  );
}
