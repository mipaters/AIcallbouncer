import { useEffect, useState } from "react";
import { useDemo } from "../context/DemoContext";
import { DISPOSITION_LABEL, type Disposition } from "../types";
import { RiskBadge } from "../components/ui/Badge";
import { Disclaimer } from "../components/ui/Disclaimer";

interface TranscriptLine {
  speaker: "caller" | "ai";
  text: string;
  timestamp: string;
}

interface LatestDecision {
  recommendedDisposition: Disposition;
  riskLevel: "low" | "moderate" | "high";
  callCategory: string;
  decisionExplanation: string;
  source: "azure" | "simulation";
}

interface LiveCallRecord {
  callSid: string;
  fromMasked: string;
  toMasked: string;
  status: "in-progress" | "connecting" | "recording" | "completed" | "failed";
  startedAt: string;
  updatedAt: string;
  transcript: TranscriptLine[];
  latestDecision?: LatestDecision;
  voicemailTranscript?: string;
  endedReason?: string;
}

const POLL_INTERVAL_MS = 2000;

function useLiveCalls() {
  const [calls, setCalls] = useState<LiveCallRecord[]>([]);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/live-calls");
        if (!res.ok) return;
        const data = (await res.json()) as { configured: boolean; calls: LiveCallRecord[] };
        if (!cancelled) {
          setConfigured(data.configured);
          setCalls(data.calls);
        }
      } catch {
        // Keep showing the last known state; the next poll will retry.
      }
    }
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { calls, configured };
}

function ForwardingNumberCard() {
  const [number, setNumber] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    fetch("/api/call-forwarding-number")
      .then((res) => res.json())
      .then((data: { configured: boolean; number: string | null }) => {
        setConfigured(data.configured);
        if (data.number) {
          setNumber(data.number);
          setSaved(data.number);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/call-forwarding-number", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(number);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="card">
      <div className="section-title" style={{ marginTop: 0 }}>Real call forwarding number</div>
      <p className="card-soft">
        When Concierge AI decides to <strong>Connect</strong> a real call, it dials this number. Use your own phone
        in E.164 format (e.g. +12895551234) so you actually receive connected calls.
      </p>
      {!configured && (
        <p className="card-soft" style={{ color: "var(--rogers-red)" }}>
          Real calls are not configured yet — add <code>AZURE_STORAGE_CONNECTION_STRING</code> as a Function App
          setting first (see README).
        </p>
      )}
      <div className="field-row">
        <input
          className="text-input"
          placeholder="+12895551234"
          value={number}
          disabled={!configured}
          onChange={(e) => setNumber(e.target.value)}
        />
        <button className="btn btn-solid" disabled={!configured || status === "saving" || number === saved} onClick={handleSave}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </div>
      {status === "error" && <p className="card-soft" style={{ color: "var(--rogers-red)" }}>Could not save — try again.</p>}
      {saved && status === "idle" && saved === number && <p className="card-soft">Saved: forwarding to {saved}</p>}
    </div>
  );
}

function statusLabel(status: LiveCallRecord["status"]): string {
  switch (status) {
    case "in-progress":
      return "In progress";
    case "connecting":
      return "Connecting…";
    case "recording":
      return "Recording message";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function LiveCalls() {
  const { demoStatus } = useDemo();
  const { calls, configured } = useLiveCalls();
  const [selectedSid, setSelectedSid] = useState<string | null>(null);

  const selected = calls.find((c) => c.callSid === selectedSid) ?? calls[0] ?? null;

  return (
    <div>
      <div className="page-title">Live Calls</div>
      <p className="page-subtitle">
        Real inbound calls to your connected Twilio number, screened by Concierge AI. This is separate from the
        scripted demo in Live Demo — these are actual phone calls.
      </p>

      <ForwardingNumberCard />

      {!configured && (
        <div className="card">
          <p className="card-soft">
            Real-call tracking isn't configured yet. Add <code>AZURE_STORAGE_CONNECTION_STRING</code> (and ideally{" "}
            <code>TWILIO_AUTH_TOKEN</code> + <code>PUBLIC_BASE_URL</code>) as Function App settings, then point your
            Twilio number's Voice webhook at <code>{window.location.origin}/api/twilio/voice</code>.
          </p>
        </div>
      )}

      {configured && calls.length === 0 && (
        <div className="card">
          <div className="empty-state">
            No real calls yet. Call your Twilio number to see it appear here live.
          </div>
        </div>
      )}

      {configured && calls.length > 0 && (
        <div className="live-calls-layout">
          <div className="card" style={{ padding: 0 }}>
            {calls.map((c) => (
              <button
                key={c.callSid}
                className={`call-row ${selected?.callSid === c.callSid ? "active" : ""}`}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setSelectedSid(c.callSid)}
              >
                <div>
                  <div className="caller-name">{c.fromMasked}</div>
                  <div className="call-meta">{statusLabel(c.status)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {c.latestDecision && <RiskBadge level={c.latestDecision.riskLevel} />}
                  <div className="call-meta">{c.latestDecision ? DISPOSITION_LABEL[c.latestDecision.recommendedDisposition] : "—"}</div>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="card">
              <div className="section-title" style={{ marginTop: 0 }}>
                Call from {selected.fromMasked} · {statusLabel(selected.status)}
              </div>
              <div className="transcript">
                {selected.transcript.map((line, idx) => (
                  <div key={idx} className={`transcript-line ${line.speaker === "ai" ? "concierge" : "caller"}`}>
                    <div className="transcript-bubble">
                      <strong>{line.speaker === "ai" ? "Concierge AI" : "Caller"}:</strong> {line.text}
                    </div>
                  </div>
                ))}
                {selected.voicemailTranscript && (
                  <div className="transcript-line caller">
                    <div className="transcript-bubble">
                      <strong>Voicemail transcript:</strong> {selected.voicemailTranscript}
                    </div>
                  </div>
                )}
              </div>
              {selected.latestDecision && (
                <div className="card-soft" style={{ marginTop: 12 }}>
                  <div>
                    <RiskBadge level={selected.latestDecision.riskLevel} /> · {DISPOSITION_LABEL[selected.latestDecision.recommendedDisposition]}
                  </div>
                  <p>{selected.latestDecision.decisionExplanation}</p>
                  <p className="call-meta">Source: {selected.latestDecision.source === "azure" ? "Azure OpenAI" : "Deterministic simulation"}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="card-soft" style={{ marginTop: 16 }}>
        Concierge AI status: {demoStatus.message}
      </p>
      <Disclaimer text="Real calls are handled by your own Twilio number and Azure resources. No call audio or transcripts are shared with Rogers or any third party by this demo." />
    </div>
  );
}
