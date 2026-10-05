import { useState } from "react";
import { useDemo } from "../context/DemoContext";
import type { Disposition, PreferencesState } from "../types";
import { CALL_CATEGORY_LABEL, DISPOSITION_LABEL, AVAILABILITY_LABEL } from "../types";
import { GREETINGS } from "../data/preferences";
import { Disclaimer } from "../components/ui/Disclaimer";
import { parsePreferences, type ParsedPreferenceRule } from "../lib/api";

const DISPOSITIONS: Disposition[] = ["connect", "ask", "notify", "voicemail", "decline"];
const AVAILABILITIES: PreferencesState["availability"][] = [
  "available",
  "meeting",
  "focus",
  "driving",
  "quiet-hours",
  "vacation",
  "do-not-disturb",
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </label>
  );
}

export function Preferences() {
  const { preferences, setPreferences } = useDemo();
  const [nlInput, setNlInput] = useState("");
  const [proposedRules, setProposedRules] = useState<ParsedPreferenceRule[] | null>(null);
  const [nlSource, setNlSource] = useState<"azure" | "simulation" | null>(null);
  const [parsing, setParsing] = useState(false);

  function updatePeople<K extends keyof PreferencesState["people"]>(key: K, value: boolean) {
    setPreferences({ ...preferences, people: { ...preferences.people, [key]: value } });
  }

  function updateCallType(category: string, action: Disposition) {
    setPreferences({
      ...preferences,
      callTypes: preferences.callTypes.map((r) => (r.category === category ? { ...r, action } : r)),
    });
  }

  async function handleParse() {
    if (!nlInput.trim()) return;
    setParsing(true);
    try {
      const result = await parsePreferences(nlInput);
      setProposedRules(result.rules);
      setNlSource(result.source);
    } finally {
      setParsing(false);
    }
  }

  function applyProposedRules() {
    if (!proposedRules) return;
    let next = { ...preferences };
    for (const rule of proposedRules) {
      const action = rule.action as Disposition;
      next = {
        ...next,
        callTypes: next.callTypes.map((r) =>
          rule.callType.includes(r.category) || r.label.toLowerCase().includes(rule.callType.split(" / ")[0]) ? { ...r, action } : r,
        ),
      };
    }
    setPreferences(next);
    setProposedRules(null);
    setNlInput("");
  }

  return (
    <div>
      <div className="page-title">Call Preferences</div>
      <p className="page-subtitle">All preferences below are editable and apply only within this demonstration.</p>

      <div className="section-title">Natural-Language Setup</div>
      <div className="card">
        <textarea
          className="textarea-input"
          placeholder={'e.g. "Always put through calls from my family and my children\u2019s school. Ask me about healthcare calls. Send sales calls to voicemail unless I have requested the call."'}
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
        />
        <button className="btn btn-solid btn-block" style={{ marginTop: 10 }} disabled={parsing} onClick={handleParse}>
          {parsing ? "Analyzing…" : "Generate preference proposal"}
        </button>
        {proposedRules && (
          <div className="card-soft" style={{ marginTop: 12 }}>
            <p style={{ marginTop: 0, fontWeight: 700 }}>
              Proposed rules {nlSource === "simulation" ? "(simulation mode)" : "(Azure AI)"} — review before applying:
            </p>
            <ul style={{ paddingLeft: 18 }}>
              {proposedRules.map((r, i) => (
                <li key={i}>{r.description}</li>
              ))}
            </ul>
            <button className="btn btn-solid btn-block" onClick={applyProposedRules}>
              Apply these rules
            </button>
          </div>
        )}
      </div>

      <div className="section-title">People</div>
      <div className="card">
        <div className="pref-row">
          <span>Always allow contacts</span>
          <Toggle checked={preferences.people.alwaysAllowContacts} onChange={(v) => updatePeople("alwaysAllowContacts", v)} />
        </div>
        <div className="pref-row">
          <span>Always allow favourites</span>
          <Toggle checked={preferences.people.alwaysAllowFavourites} onChange={(v) => updatePeople("alwaysAllowFavourites", v)} />
        </div>
        <div className="pref-row">
          <span>Always screen unfamiliar numbers</span>
          <Toggle checked={preferences.people.alwaysScreenUnfamiliar} onChange={(v) => updatePeople("alwaysScreenUnfamiliar", v)} />
        </div>
        <div className="pref-row">
          <span>Allow repeat callers</span>
          <Toggle checked={preferences.people.allowRepeatCallers} onChange={(v) => updatePeople("allowRepeatCallers", v)} />
        </div>
        <div className="pref-row">
          <span>Allow approved organizations</span>
          <Toggle checked={preferences.people.allowApprovedOrganizations} onChange={(v) => updatePeople("allowApprovedOrganizations", v)} />
        </div>
      </div>

      <div className="section-title">Call Types</div>
      <div className="card">
        {preferences.callTypes.map((rule) => (
          <div key={rule.category} className="pref-row" style={{ flexWrap: "wrap" }}>
            <span style={{ minWidth: 140 }}>{CALL_CATEGORY_LABEL[rule.category]}</span>
            <select className="select-input" style={{ width: "auto" }} value={rule.action} onChange={(e) => updateCallType(rule.category, e.target.value as Disposition)}>
              {DISPOSITIONS.map((d) => (
                <option key={d} value={d}>
                  {DISPOSITION_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="section-title">Availability</div>
      <div className="card">
        <div className="pill-select">
          {AVAILABILITIES.map((a) => (
            <button key={a} className={`pill ${preferences.availability === a ? "active" : ""}`} onClick={() => setPreferences({ ...preferences, availability: a })}>
              {AVAILABILITY_LABEL[a]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1 }}>
            <label className="call-meta">Quiet hours start</label>
            <input
              className="text-input"
              type="time"
              value={preferences.quietHours.start}
              onChange={(e) => setPreferences({ ...preferences, quietHours: { ...preferences.quietHours, start: e.target.value } })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="call-meta">Quiet hours end</label>
            <input
              className="text-input"
              type="time"
              value={preferences.quietHours.end}
              onChange={(e) => setPreferences({ ...preferences, quietHours: { ...preferences.quietHours, end: e.target.value } })}
            />
          </div>
        </div>
      </div>

      <div className="section-title">Suspicious Calls</div>
      <div className="card">
        <div className="pill-select">
          {(["block-and-alert", "voicemail-and-alert", "ask-before-blocking"] as const).map((opt) => (
            <button key={opt} className={`pill ${preferences.suspiciousCalls === opt ? "active" : ""}`} onClick={() => setPreferences({ ...preferences, suspiciousCalls: opt })}>
              {opt === "block-and-alert" ? "Block and alert" : opt === "voicemail-and-alert" ? "Voicemail and alert" : "Ask me before blocking"}
            </button>
          ))}
        </div>
        <div className="pref-row" style={{ marginTop: 10 }}>
          <span>Save transcript for this session</span>
          <Toggle checked={preferences.saveTranscript} onChange={(v) => setPreferences({ ...preferences, saveTranscript: v })} />
        </div>
      </div>

      <div className="section-title">Doorperson Greeting &amp; Voice</div>
      <div className="card">
        <label className="call-meta">Greeting style</label>
        <select
          className="select-input"
          value={preferences.greetingStyle}
          onChange={(e) => setPreferences({ ...preferences, greetingStyle: e.target.value as PreferencesState["greetingStyle"] })}
        >
          <option value="default">Default</option>
          <option value="concise">Concise</option>
          <option value="warm">Warm</option>
          <option value="formal">Formal</option>
        </select>
        <p className="card-soft" style={{ marginTop: 10 }}>{GREETINGS[preferences.greetingStyle]}</p>

        <label className="call-meta">Voice style</label>
        <select
          className="select-input"
          value={preferences.voiceStyle}
          onChange={(e) => setPreferences({ ...preferences, voiceStyle: e.target.value as PreferencesState["voiceStyle"] })}
        >
          <option value="warm">Warm</option>
          <option value="professional">Professional</option>
          <option value="concise">Concise</option>
        </select>
      </div>

      <Disclaimer text="All preferences are stored only for this demo session and reset when you choose Reset Demo." />
    </div>
  );
}
