import { Disclaimer } from "../components/ui/Disclaimer";

const STEPS = [
  "An incoming call arrives from a number.",
  "Concierge AI checks whether the number is recognized.",
  "Recognized contacts and approved callers are put through normally.",
  "Unrecognized callers are greeted by the AI gatekeeper.",
  "The gatekeeper asks the caller's name, organization, and reason for calling.",
  "It listens to the caller's response.",
  "It evaluates the call's purpose, urgency, relevance, and possible risk.",
  "It decides how to handle the call based on the subscriber's preferences.",
  "The subscriber receives an appropriate notification.",
  "A short call summary is added to the subscriber's call history.",
];

export function HowItWorks() {
  return (
    <div>
      <div className="page-title">How It Works</div>
      <p className="page-subtitle">
        Concierge AI is more than spam blocking — it answers the call, has a short conversation with the caller, and
        decides how to handle it based on your preferences.
      </p>

      <div className="card">
        {STEPS.map((s, i) => (
          <div key={i} className="field-row">
            <span className="field-label">Step {i + 1}</span>
            <span className="field-value">{s}</span>
          </div>
        ))}
      </div>

      <div className="section-title">Six Possible Outcomes</div>
      <div className="card">
        {[
          ["Connect Now", "The caller is recognized, trusted, or matches an approved priority."],
          ["Ask Me", "Concierge AI alerts you and asks whether to take the call."],
          ["Notify Me", "A text-style summary is sent without interrupting you."],
          ["Send to Voicemail", "The caller is told you're unavailable."],
          ["Politely Decline", "Used for unsolicited sales, surveys, and non-priority solicitations."],
          ["Block and Alert", "Used for suspicious or unsafe calls — the call is ended and you are alerted."],
        ].map(([title, desc]) => (
          <div key={title} className="field-row">
            <span className="field-label">{title}</span>
            <span className="field-value">{desc}</span>
          </div>
        ))}
      </div>
      <Disclaimer />
    </div>
  );
}
