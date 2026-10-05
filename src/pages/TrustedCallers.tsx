import { useState } from "react";
import { useDemo } from "../context/DemoContext";
import type { TrustedCaller } from "../types";
import { Disclaimer } from "../components/ui/Disclaimer";

const CATEGORY_LABEL: Record<TrustedCaller["category"], string> = {
  personal: "Personal",
  family: "Family",
  school: "School",
  healthcare: "Healthcare",
  work: "Work",
  "home-services": "Home Services",
  delivery: "Delivery",
  "approved-org": "Approved Organization",
};

export function TrustedCallers() {
  const { trustedCallers, setTrustedCallers } = useDemo();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [category, setCategory] = useState<TrustedCaller["category"]>("personal");

  function addCaller() {
    if (!name.trim() || !number.trim()) return;
    const next: TrustedCaller = {
      id: `tc-${Date.now()}`,
      name: name.trim(),
      number: number.trim(),
      category,
      status: "always-allow",
      addedOn: new Date().toISOString().slice(0, 10),
    };
    setTrustedCallers([next, ...trustedCallers]);
    setName("");
    setNumber("");
  }

  function removeCaller(id: string) {
    setTrustedCallers(trustedCallers.filter((c) => c.id !== id));
  }

  function cycleStatus(id: string) {
    const order: TrustedCaller["status"][] = ["always-allow", "always-screen", "temporarily-allow"];
    setTrustedCallers(
      trustedCallers.map((c) =>
        c.id === id ? { ...c, status: order[(order.indexOf(c.status) + 1) % order.length] } : c,
      ),
    );
  }

  return (
    <div>
      <div className="page-title">Trusted Callers</div>
      <p className="page-subtitle">
        A synthetic list of contacts and organizations. Real device contacts are never accessed — production use would
        require explicit customer permission.
      </p>

      <div className="card">
        <label className="call-meta">Add a trusted caller</label>
        <input className="text-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 8 }} />
        <input className="text-input" placeholder="Phone number" value={number} onChange={(e) => setNumber(e.target.value)} style={{ marginBottom: 8 }} />
        <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value as TrustedCaller["category"])} style={{ marginBottom: 10 }}>
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button className="btn btn-solid btn-block" onClick={addCaller}>
          Add trusted caller
        </button>
      </div>

      <div className="section-title">Current List</div>
      <div className="card">
        {trustedCallers.map((c) => (
          <div key={c.id} className="call-row">
            <div>
              <div className="caller-name">{c.name}</div>
              <div className="call-meta">
                {c.number} · {CATEGORY_LABEL[c.category]}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <button className="pill active" style={{ marginBottom: 6 }} onClick={() => cycleStatus(c.id)}>
                {c.status.replace(/-/g, " ")}
              </button>
              <div>
                <button className="menu-button" onClick={() => removeCaller(c.id)} aria-label="Remove">
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
        {trustedCallers.length === 0 && <div className="empty-state">No trusted callers yet.</div>}
      </div>
      <Disclaimer />
    </div>
  );
}
