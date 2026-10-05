import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { CALL_CATEGORY_LABEL, DISPOSITION_LABEL, type Disposition } from "../types";
import { RiskBadge } from "../components/ui/Badge";
import { Disclaimer } from "../components/ui/Disclaimer";

type Filter = "all" | "connect" | "notify" | "voicemail" | "decline" | "block" | "ask";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "connect", label: "Connected" },
  { key: "notify", label: "Messages" },
  { key: "voicemail", label: "Voicemail" },
  { key: "decline", label: "Declined" },
  { key: "block", label: "Blocked" },
  { key: "ask", label: "Suspicious" },
];

export function CallHistory() {
  const { callHistory } = useDemo();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = callHistory.filter((c) => {
    if (filter === "all") return true;
    if (filter === "ask") return c.riskLevel === "high";
    return c.disposition === (filter as Disposition);
  });

  return (
    <div>
      <div className="page-title">Call History</div>
      <p className="page-subtitle">All records below are synthetic and created for this demonstration session.</p>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button key={f.key} className={`pill ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.map((c) => (
          <Link key={c.id} to={`/history/${c.id}`} className="call-row">
            <div>
              <div className="caller-name">{c.callerName}</div>
              <div className="call-meta">
                {c.number} · {CALL_CATEGORY_LABEL[c.category]}
              </div>
              <div className="call-meta">{c.reason}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <RiskBadge level={c.riskLevel} />
              <div className="call-meta">{DISPOSITION_LABEL[c.disposition]}</div>
              <div className="call-meta">{c.time}</div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="empty-state">No calls match this filter.</div>}
      </div>
      <Disclaimer />
    </div>
  );
}
