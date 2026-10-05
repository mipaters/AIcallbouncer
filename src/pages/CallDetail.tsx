import { Link, useParams } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { CALL_CATEGORY_LABEL, DISPOSITION_LABEL } from "../types";
import { RiskBadge } from "../components/ui/Badge";
import { Disclaimer } from "../components/ui/Disclaimer";

export function CallDetail() {
  const { id } = useParams();
  const { callHistory } = useDemo();
  const entry = callHistory.find((c) => c.id === id);

  if (!entry) {
    return (
      <div>
        <p>Call record not found.</p>
        <Link to="/history" className="btn btn-outline">
          ← Back to history
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/history" className="call-meta">
        ← Back to history
      </Link>
      <div className="page-title">{entry.callerName}</div>
      <p className="page-subtitle">
        {entry.number} · {CALL_CATEGORY_LABEL[entry.category]} · {entry.recognized ? "Recognized" : "Unrecognized"}
      </p>

      <div className="card">
        <div className="field-row">
          <span className="field-label">Decision</span>
          <span className="field-value">{DISPOSITION_LABEL[entry.disposition]}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Risk level</span>
          <span className="field-value">
            <RiskBadge level={entry.riskLevel} />
          </span>
        </div>
        <div className="field-row">
          <span className="field-label">Time</span>
          <span className="field-value">{entry.time}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Duration</span>
          <span className="field-value">{entry.durationSeconds}s</span>
        </div>
        <div className="field-row">
          <span className="field-label">Subscriber action</span>
          <span className="field-value">{entry.subscriberAction}</span>
        </div>
      </div>

      <div className="section-title">Decision Explanation</div>
      <div className="card-soft">{entry.decisionExplanation}</div>

      {entry.signalsDetected.length > 0 && (
        <>
          <div className="section-title">Signals Detected</div>
          <div className="alert-banner danger">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {entry.signalsDetected.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {entry.questionsAsked.length > 0 && (
        <>
          <div className="section-title">Questions Asked</div>
          <div className="card-soft">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {entry.questionsAsked.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {entry.transcriptAvailable && entry.transcript.length > 0 && (
        <>
          <div className="section-title">Transcript</div>
          <div className="card">
            {entry.transcript.map((line, i) => (
              <div key={i} className={`transcript-line ${line.speaker}`}>
                <div className="transcript-bubble">{line.text}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <Disclaimer />
    </div>
  );
}
