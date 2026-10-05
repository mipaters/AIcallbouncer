import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SCENARIOS, getScenario } from "../data/scenarios";
import type { CallHistoryEntry, LiveUnderstanding, TranscriptLine } from "../types";
import { CALL_CATEGORY_LABEL, DISPOSITION_LABEL } from "../types";
import { useDemo } from "../context/DemoContext";
import { Disclaimer } from "../components/ui/Disclaimer";
import { RiskBadge } from "../components/ui/Badge";
import { ArchitectureOverview } from "../components/ui/ArchitectureOverview";
import { FOLLOW_UP_QUESTIONS, analyzeCallerText } from "../engine/decisionEngine";

type DemoMode = "guided" | "interactive" | "microphone";
type ExecutivePhase = "intro" | "scenarios" | "architecture";

const EXECUTIVE_SEQUENCE = ["dental-appointment", "rogers-impersonation"];

function useSpeechRecognition() {
  const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SpeechRecognitionCtor as (new () => any) | undefined;
}

export function LiveDemo() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addCallHistoryEntry, preferences } = useDemo();

  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [mode, setMode] = useState<DemoMode>("guided");
  const [stepIndex, setStepIndex] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [understanding, setUnderstanding] = useState<LiveUnderstanding>({});
  const [riskSignals, setRiskSignals] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [executiveQueue, setExecutiveQueue] = useState<string[] | null>(null);
  const [executivePartIndex, setExecutivePartIndex] = useState(0);
  const [executivePhase, setExecutivePhase] = useState<ExecutivePhase>("intro");
  const [micListening, setMicListening] = useState(false);
  const [micTranscript, setMicTranscript] = useState("");
  const [micResult, setMicResult] = useState<ReturnType<typeof analyzeCallerText> | null>(null);
  const recognitionRef = useRef<any>(null);
  const SpeechRecognitionCtor = useSpeechRecognition();

  const scenario = scenarioId ? getScenario(scenarioId) : undefined;

  useEffect(() => {
    if (params.get("executive") === "1" && !executiveQueue) {
      setExecutiveQueue(EXECUTIVE_SEQUENCE);
      setExecutivePartIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startScenario(id: string) {
    setScenarioId(id);
    setMode("guided");
    setStepIndex(0);
    setTranscript([]);
    setUnderstanding({});
    setRiskSignals([]);
    setFinished(false);
    setAnswering(true);
    setMicResult(null);
    setTimeout(() => setAnswering(false), 1400);
  }

  function resetPlayer() {
    setScenarioId(null);
    setStepIndex(0);
    setTranscript([]);
    setUnderstanding({});
    setRiskSignals([]);
    setFinished(false);
    setMicResult(null);
  }

  function advance(chosenCallerLine?: string) {
    if (!scenario) return;
    const step = scenario.steps[stepIndex];
    if (!step) return;
    const next: TranscriptLine[] = [...transcript];
    if (chosenCallerLine ?? step.callerLine) {
      next.push({ speaker: "caller", text: chosenCallerLine ?? step.callerLine! });
    }
    if (step.conciergeLine) next.push({ speaker: "concierge", text: step.conciergeLine });
    if (step.systemNote) next.push({ speaker: "system", text: step.systemNote });
    setTranscript(next);
    if (step.understanding) setUnderstanding((prev) => ({ ...prev, ...step.understanding }));
    if (step.riskSignals) setRiskSignals((prev) => [...prev, ...step.riskSignals!]);

    if (stepIndex + 1 >= scenario.steps.length) {
      setFinished(true);
      commitToHistory(scenario.id);
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function commitToHistory(id: string) {
    const s = getScenario(id);
    if (!s) return;
    const entry: CallHistoryEntry = {
      id: `live-${id}-${Date.now()}`,
      callerName: s.callerName,
      number: s.callerNumber.replace(/\d(?=\d{2})/g, (m, i) => (i < s.callerNumber.length - 6 ? "•" : m)),
      recognized: s.recognized,
      category: s.category,
      reason: s.steps.find((st) => st.understanding?.purpose)?.understanding?.purpose ?? s.title,
      disposition: s.finalDisposition,
      riskLevel: s.steps.some((st) => st.riskSignals?.length) ? (s.finalDisposition === "block" ? "high" : "moderate") : "low",
      time: "Just now",
      durationSeconds: 20 + s.steps.length * 8,
      transcriptAvailable: true,
      messageAvailable: true,
      subscriberAction: "Handled via Canned Demo",
      transcript: s.steps.flatMap<TranscriptLine>((st) => {
        const lines: TranscriptLine[] = [];
        if (st.callerLine) lines.push({ speaker: "caller", text: st.callerLine });
        if (st.conciergeLine) lines.push({ speaker: "concierge", text: st.conciergeLine });
        if (st.systemNote) lines.push({ speaker: "system", text: st.systemNote });
        return lines;
      }),
      decisionExplanation: s.decisionExplanation,
      questionsAsked: s.steps.filter((st) => st.conciergeLine?.includes("?")).map((st) => st.conciergeLine!),
      signalsDetected: s.steps.flatMap((st) => st.riskSignals ?? []),
    };
    addCallHistoryEntry(entry);
  }

  function goNextExecutivePart() {
    if (!executiveQueue) return;
    const nextIndex = executivePartIndex + 1;
    if (nextIndex >= executiveQueue.length) {
      setScenarioId(null);
      setExecutivePhase("architecture");
      return;
    }
    setExecutivePartIndex(nextIndex);
    startScenario(executiveQueue[nextIndex]);
  }

  function finishExecutiveDemo() {
    setExecutiveQueue(null);
    setExecutivePhase("intro");
    resetPlayer();
    navigate("/live-demo");
  }

  function beginExecutiveWalkthrough() {
    setExecutivePhase("scenarios");
    setExecutivePartIndex(0);
    startScenario(executiveQueue![0]);
  }

  function startMic() {
    if (!SpeechRecognitionCtor) {
      alert("Microphone speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      setMicTranscript(text);
    };
    recognition.onend = () => setMicListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setMicListening(true);
    setMicTranscript("");
    setMicResult(null);
  }

  function stopMic() {
    recognitionRef.current?.stop();
    setMicListening(false);
  }

  function evaluateMicTranscript() {
    const result = analyzeCallerText(micTranscript || "Hello, I need to speak with someone.", false);
    setMicResult(result);
  }

  const currentStep = scenario?.steps[stepIndex];
  const scenarioDone = (scenario && stepIndex >= scenario.steps.length) || finished;

  if (executiveQueue && executivePhase === "intro" && !scenario) {
    return (
      <div>
        <div className="page-title">Executive Overview</div>
        <p className="page-subtitle">What Concierge AI is, what it does, and why it matters — before the walkthrough.</p>

        <div className="section-title">What it is</div>
        <div className="card">
          <p style={{ marginTop: 0 }}>
            Concierge AI is an AI-powered call-screening assistant that answers unfamiliar calls on a subscriber's
            behalf — before they ever reach the subscriber's phone, voicemail, or get missed entirely.
          </p>
        </div>

        <div className="section-title">What it does</div>
        <div className="card">
          <p style={{ marginTop: 0 }}>
            It greets the caller, finds out who they are and why they're calling, and gauges intent, urgency, and
            risk — then connects, asks a follow-up question, notifies the subscriber, sends the caller to voicemail,
            or blocks the call outright, all according to the subscriber's own preferences.
          </p>
        </div>

        <div className="section-title">Value for the operator</div>
        <div className="card">
          <p style={{ marginTop: 0 }}>
            A differentiated, premium subscriber service that reduces spam and scam exposure, increases trust and
            safety, and creates a new average-revenue-per-user opportunity — deployable on top of existing network
            voice infrastructure rather than replacing it.
          </p>
        </div>

        <button className="btn btn-solid btn-block" onClick={beginExecutiveWalkthrough}>
          Begin walkthrough →
        </button>
        <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={finishExecutiveDemo}>
          ← Exit executive demo
        </button>
      </div>
    );
  }

  if (executivePhase === "architecture") {
    return (
      <div>
        <div className="page-title">Solution Architecture</div>
        <p className="page-subtitle">What you just saw is deployed like this today — here's how a production deployment would differ.</p>

        <ArchitectureOverview />

        <Disclaimer />

        <button className="btn btn-solid btn-block" onClick={finishExecutiveDemo}>
          Finish Executive Demo
        </button>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div>
        <div className="page-title">Canned Demos</div>
        <p className="page-subtitle">Select a demo mode and a scripted scenario to see Concierge AI in action.</p>

        <div className="section-title">Demo Mode</div>
        <div className="pill-select" style={{ marginBottom: 18 }}>
          {(["guided", "interactive", "microphone"] as DemoMode[]).map((m) => (
            <button key={m} className={`pill ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
              {m === "guided" ? "Guided Scenario" : m === "interactive" ? "Interactive Caller" : "Microphone Simulation"}
            </button>
          ))}
        </div>

        {mode === "microphone" ? (
          <div className="card">
            <p style={{ marginTop: 0 }}>
              Play the role of the caller using your microphone. This requires explicit browser permission and is clearly a
              simulation — no audio is stored long-term.
            </p>
            {!micListening ? (
              <button className="btn btn-solid btn-block" onClick={startMic}>
                🎙 Start speaking as the caller
              </button>
            ) : (
              <button className="btn btn-outline btn-block" onClick={stopMic}>
                ⏹ Stop
              </button>
            )}
            {micListening && (
              <p style={{ marginTop: 10, fontWeight: 600 }}>
                <span className="status-dot high" style={{ background: "var(--rogers-red)" }} /> Microphone active — simulation
                only
              </p>
            )}
            {micTranscript && <div className="card-soft">{micTranscript}</div>}
            {micTranscript && !micListening && (
              <button className="btn btn-solid btn-block" onClick={evaluateMicTranscript}>
                Analyze what was said
              </button>
            )}
            {micResult && (
              <div className="card-soft">
                <div className="field-row">
                  <span className="field-label">Category</span>
                  <span className="field-value">{CALL_CATEGORY_LABEL[micResult.callCategory]}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Risk</span>
                  <span className="field-value">
                    <RiskBadge level={micResult.riskLevel} />
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">Recommended disposition</span>
                  <span className="field-value">{DISPOSITION_LABEL[micResult.recommendedDisposition]}</span>
                </div>
                <p style={{ fontSize: 13 }}>{micResult.decisionExplanation}</p>
                <Disclaimer text={micResult.disclaimer} />
              </div>
            )}
          </div>
        ) : (
          <div className="scenario-grid">
            {SCENARIOS.map((s) => (
              <button key={s.id} className="scenario-card" onClick={() => startScenario(s.id)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.shortLabel}</div>
                  <div className="call-meta">{CALL_CATEGORY_LABEL[s.category]} · {s.recognized ? "Recognized" : "Unrecognized"}</div>
                </div>
                <span>▶</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (answering) {
    return (
      <div className="incoming-call">
        <div className="avatar">{scenario.callerName.charAt(0)}</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{scenario.callerName}</div>
        <div className="call-meta">{scenario.callerNumber}</div>
        <div className="call-meta">{scenario.recognized ? "Recognized" : "Unrecognized number"}</div>
        {scenario.approximateLocation && <div className="call-meta">{scenario.approximateLocation}</div>}
        <p style={{ marginTop: 24, fontWeight: 700 }}>Concierge AI is answering for you</p>
      </div>
    );
  }

  return (
    <div>
      <div className="top-bar" style={{ paddingBottom: 6 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 0 }}>
            {scenario.title}
          </div>
          <div className="call-meta">
            {scenario.callerName} · {scenario.callerNumber} · {scenario.recognized ? "Recognized" : "Unrecognized"}
          </div>
        </div>
        <button className="menu-button" onClick={executiveQueue ? finishExecutiveDemo : resetPlayer}>
          ✕
        </button>
      </div>

      <div className="section-title">Caller Conversation</div>
      <div className="card">
        {transcript.length === 0 && <p className="call-meta">The conversation will appear here as it progresses.</p>}
        {transcript.map((line, i) => (
          <div key={i} className={`transcript-line ${line.speaker}`}>
            <div className="transcript-bubble">{line.text}</div>
          </div>
        ))}
      </div>

      {!scenarioDone && currentStep && (
        <div className="card">
          {mode === "interactive" && currentStep.alternateCallerLines?.length ? (
            <div className="pill-select">
              {[currentStep.callerLine, ...currentStep.alternateCallerLines].filter(Boolean).map((line, i) => (
                <button key={i} className="pill" onClick={() => advance(line as string)}>
                  {line}
                </button>
              ))}
            </div>
          ) : (
            <button className="btn btn-solid btn-block" onClick={() => advance()}>
              Continue conversation
            </button>
          )}
        </div>
      )}

      <div className="section-title">Live Understanding</div>
      <div className="card">
        <div className="field-row">
          <span className="field-label">Caller name</span>
          <span className="field-value">{understanding.callerName ?? scenario.callerName}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Organization</span>
          <span className="field-value">{understanding.organization ?? "—"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Purpose</span>
          <span className="field-value">{understanding.purpose ?? "—"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Urgency</span>
          <span className="field-value">{understanding.urgency ?? "—"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Call category</span>
          <span className="field-value">{CALL_CATEGORY_LABEL[understanding.callCategory ?? scenario.category]}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Apparent risk</span>
          <span className="field-value">{understanding.riskLevel ? <RiskBadge level={understanding.riskLevel} /> : "—"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Identity confidence</span>
          <span className="field-value">{understanding.identityConfidence ?? "—"}</span>
        </div>
      </div>

      {riskSignals.length > 0 && (
        <div className="alert-banner danger">
          <div className="alert-title">Risk signals detected</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {riskSignals.map((sig, i) => (
              <li key={i}>{sig}</li>
            ))}
          </ul>
        </div>
      )}

      {scenarioDone && (
        <>
          <div className="section-title">Decision Panel</div>
          <div className="alert-banner">
            <div className="alert-title">Recommendation: {DISPOSITION_LABEL[scenario.finalDisposition]}</div>
            <p style={{ margin: "6px 0 0" }}>{scenario.decisionExplanation}</p>
          </div>

          <div className="section-title">Subscriber Alert</div>
          <div className="card-soft">
            <p style={{ marginTop: 0 }}>{scenario.subscriberNotification}</p>
          </div>

          <div className="section-title">Presenter Notes</div>
          <div className="card">
            <div className="field-row">
              <span className="field-label">Caller wants</span>
              <span className="field-value">{scenario.presenterNotes.callerWants}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Concierge asks</span>
              <span className="field-value">{scenario.presenterNotes.conciergeAsks}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Relevant preferences</span>
              <span className="field-value">{scenario.presenterNotes.relevantPreferences}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Why this outcome</span>
              <span className="field-value">{scenario.presenterNotes.whyThisOutcome}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Simulated</span>
              <span className="field-value">{scenario.presenterNotes.whatIsSimulated}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Needs production</span>
              <span className="field-value">{scenario.presenterNotes.whatRequiresProduction}</span>
            </div>
          </div>

          <Disclaimer />

          {executiveQueue ? (
            <button className="btn btn-solid btn-block" onClick={goNextExecutivePart}>
              {executivePartIndex + 1 >= executiveQueue.length ? "Next: Architecture Overview" : "Next: Executive Demo Part " + (executivePartIndex + 2)}
            </button>
          ) : (
            <button className="btn btn-outline btn-block" onClick={resetPlayer}>
              ← Choose another scenario
            </button>
          )}
        </>
      )}

      {!scenarioDone && mode !== "microphone" && (
        <div className="action-grid">
          <button className="btn btn-outline" onClick={() => alert("Follow-up question: " + FOLLOW_UP_QUESTIONS[stepIndex % FOLLOW_UP_QUESTIONS.length])}>
            Ask another question
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              setFinished(true);
              commitToHistory(scenario.id);
            }}
          >
            Send to voicemail
          </button>
        </div>
      )}
      {preferences.quickMode === "maximum-protection" && !scenarioDone && (
        <p className="call-meta" style={{ marginTop: 8 }}>
          Maximum Protection mode is active — all unfamiliar callers are screened closely.
        </p>
      )}
    </div>
  );
}
