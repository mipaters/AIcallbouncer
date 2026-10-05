import type { RiskLevel } from "../../types";

const LABEL: Record<RiskLevel, string> = { low: "Low Risk", moderate: "Moderate Risk", high: "High Risk" };

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`badge badge-${level}`}>{LABEL[level]}</span>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "low" | "moderate" | "high" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
