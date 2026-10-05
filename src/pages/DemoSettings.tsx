import { useDemo } from "../context/DemoContext";
import { Disclaimer } from "../components/ui/Disclaimer";

export function DemoSettings() {
  const { demoStatus, resetDemo, deleteHistory } = useDemo();

  return (
    <div>
      <div className="page-title">Demo Settings</div>

      <div className="card">
        <div className="field-row">
          <span className="field-label">Active state</span>
          <span className="field-value">
            <span className={`status-dot ${demoStatus.mode}`} />{" "}
            {demoStatus.mode === "connected" ? "Azure services connected" : demoStatus.mode === "partial" ? "Partial services connected" : "Simulation mode"}
          </span>
        </div>
        <div className="field-row">
          <span className="field-label">Azure OpenAI</span>
          <span className="field-value">{demoStatus.azureOpenAIConfigured ? "Configured" : "Not configured"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Azure Speech</span>
          <span className="field-value">{demoStatus.azureSpeechConfigured ? "Configured" : "Not configured"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Real calls (Twilio)</span>
          <span className="field-value">{demoStatus.realCallsConfigured ? "Configured" : "Not configured"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Twilio signature validation</span>
          <span className="field-value">{demoStatus.twilioValidationConfigured ? "Configured" : "Not configured"}</span>
        </div>
      </div>
      <p className="card-soft">{demoStatus.message}</p>

      <div className="section-title">Session Controls</div>
      <div className="card" style={{ display: "grid", gap: 10 }}>
        <button className="btn btn-outline btn-block" onClick={deleteHistory}>
          Delete demo history
        </button>
        <button className="btn btn-solid btn-block" onClick={resetDemo}>
          Reset demo
        </button>
      </div>

      <Disclaimer text="Connected Mode uses configured Azure AI services. Simulation Mode uses deterministic scripted logic. Error Mode falls back to simulation automatically if a connected service fails." />
    </div>
  );
}
