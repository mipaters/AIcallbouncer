export function About() {
  return (
    <div>
      <div className="page-title">About This Concept</div>
      <div className="card">
        <p style={{ marginTop: 0 }}>
          <strong>Rogers Doorperson AI</strong> is a personal call gatekeeper concept. It answers calls from
          unfamiliar numbers before they reach the subscriber, politely speaks with the caller, determines who is
          calling and why, and decides how the call should be handled based on the subscriber's preferences and the
          apparent risk of the call.
        </p>
        <p>
          <strong>Tagline:</strong> Only the calls that matter get through.
        </p>
        <p>
          Rogers Doorperson AI could complement existing caller identification, reputation, spam blocking, and
          fraud-detection services by adding a personal, conversational layer of call screening.
        </p>
      </div>

      <div className="alert-banner">
        <div className="alert-title">Responsible Demo Statement</div>
        <p style={{ margin: "6px 0 0" }}>
          Rogers Doorperson AI is an illustrative concept demonstration using synthetic callers, contacts,
          conversations, preferences, and call decisions. It is not connected to Rogers customer, network, voicemail,
          billing, security, or telecommunications systems. The demonstration cannot intercept, answer, route, block,
          or transfer real phone calls. AI-generated summaries and risk assessments may be incomplete or incorrect.
        </p>
      </div>
    </div>
  );
}
