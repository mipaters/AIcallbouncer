import { Link } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { EXECUTIVE_METRICS } from "../data/callHistory";
import { Badge, RiskBadge } from "../components/ui/Badge";
import { Disclaimer } from "../components/ui/Disclaimer";
import { QUICK_MODE_DESCRIPTION, QUICK_MODE_LABEL } from "../data/preferences";
import type { QuickMode } from "../types";
import { AVAILABILITY_LABEL, DISPOSITION_LABEL } from "../types";

const QUICK_MODES: QuickMode[] = ["available", "focus", "quiet", "family-priority", "maximum-protection"];

export function Home() {
  const { preferences, applyQuickMode, callHistory, demoStatus } = useDemo();
  const recent = callHistory.slice(0, 5);

  return (
    <div>
      <div className="hero">
        <h1>Your calls. Your time. Your rules.</h1>
        <p>Concierge AI answers unfamiliar callers, finds out what they need, and only puts through the calls that matter.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link to="/live-calls" className="btn btn-primary">
            Live demo
          </Link>
          <Link to="/preferences" className="btn btn-secondary">
            Set my call preferences
          </Link>
        </div>
      </div>

      <Link to="/live-demo?executive=1" className="btn btn-solid btn-block" style={{ marginBottom: 18 }}>
        ▶ Run Executive Demo
      </Link>

      <div className="section-title">Quick Modes</div>
      <div className="pill-select" style={{ marginBottom: 6 }}>
        {QUICK_MODES.map((mode) => (
          <button
            key={mode}
            className={`pill ${preferences.quickMode === mode ? "active" : ""}`}
            onClick={() => applyQuickMode(mode)}
          >
            {QUICK_MODE_LABEL[mode]}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "var(--charcoal-soft)", marginBottom: 18 }}>
        {QUICK_MODE_DESCRIPTION[preferences.quickMode]}
      </p>

      <div className="section-title">Concierge Status</div>
      <div className="card">
        <div className="field-row">
          <span className="field-label">Concierge AI</span>
          <span className="field-value">Active</span>
        </div>
        <div className="field-row">
          <span className="field-label">Current mode</span>
          <span className="field-value">{AVAILABILITY_LABEL[preferences.availability]}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Unknown callers</span>
          <span className="field-value">Screen first</span>
        </div>
        <div className="field-row">
          <span className="field-label">Suspected scams</span>
          <span className="field-value">Block and alert</span>
        </div>
        <div className="field-row">
          <span className="field-label">Quiet hours</span>
          <span className="field-value">
            {preferences.quietHours.start} – {preferences.quietHours.end}
          </span>
        </div>
        <div className="field-row">
          <span className="field-label">Connected services</span>
          <span className="field-value">
            <span className={`status-dot ${demoStatus.mode}`} /> {demoStatus.mode === "connected" ? "Connected" : demoStatus.mode === "partial" ? "Partial" : "Simulation"}
          </span>
        </div>
      </div>

      <div className="section-title">Today's Summary</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{EXECUTIVE_METRICS.callsScreened}</div>
          <div className="stat-label">Calls screened</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">3</div>
          <div className="stat-label">Calls connected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{EXECUTIVE_METRICS.messagesCapatured}</div>
          <div className="stat-label">Messages delivered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{EXECUTIVE_METRICS.suspiciousBlocked}</div>
          <div className="stat-label">Suspicious call blocked</div>
        </div>
      </div>
      <Disclaimer text="Illustrative demonstration data." />

      <div className="section-title">Recent Calls</div>
      <div className="card">
        {recent.map((c) => (
          <Link key={c.id} to={`/history/${c.id}`} className="call-row">
            <div>
              <div className="caller-name">{c.callerName}</div>
              <div className="call-meta">
                {c.reason} · {DISPOSITION_LABEL[c.disposition]}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <RiskBadge level={c.riskLevel} />
              <div className="call-meta">{c.time}</div>
            </div>
          </Link>
        ))}
        {recent.length === 0 && <div className="empty-state">No calls yet. Try the Live Demo.</div>}
      </div>
      <div style={{ textAlign: "right" }}>
        <Link to="/history">
          <Badge>View all call history →</Badge>
        </Link>
      </div>
    </div>
  );
}
