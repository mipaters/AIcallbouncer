import { ArchitectureOverview } from "../components/ui/ArchitectureOverview";

export function Architecture() {
  return (
    <div>
      <div className="page-title">Architecture</div>
      <p className="page-subtitle">
        This page separates what is implemented in this demo from what a real production deployment would require.
        The demo does handle real phone calls end-to-end (via a Twilio number), but every other integration point —
        identity, contacts, history, and notifications — is simulated.
      </p>

      <ArchitectureOverview />

      <div className="alert-banner">
        <div className="alert-title">Important</div>
        <p style={{ margin: "6px 0 0" }}>
          Real calls in this demo are routed through a Twilio phone number you configure yourself, not a direct
          carrier network integration. A production deployment would replace Twilio with carrier-native call control.
        </p>
      </div>
    </div>
  );
}
