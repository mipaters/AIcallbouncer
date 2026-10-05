import { DEMO_DEPLOYMENT, PRODUCTION_DEPLOYMENT } from "../../data/architecture";

/** Renders the "what's deployed for the demo" vs "what production would require" comparison. */
export function ArchitectureOverview() {
  return (
    <>
      <div className="section-title">Deployed for This Demo</div>
      <div className="card">
        {DEMO_DEPLOYMENT.map((item) => (
          <div key={item} className="field-row">
            <span className="field-value" style={{ textAlign: "left" }}>
              {item}
            </span>
          </div>
        ))}
      </div>

      <div className="section-title">What Production Would Require</div>
      <div className="card">
        {PRODUCTION_DEPLOYMENT.map((item) => (
          <div key={item} className="field-row">
            <span className="field-value" style={{ textAlign: "left" }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
