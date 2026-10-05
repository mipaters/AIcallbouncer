import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  CallHistoryEntry,
  DemoStatus,
  PreferencesState,
  QuickMode,
  TrustedCaller,
} from "../types";
import { DEFAULT_PREFERENCES } from "../data/preferences";
import { TRUSTED_CALLERS } from "../data/trustedCallers";
import { INITIAL_CALL_HISTORY } from "../data/callHistory";
import { getDemoStatus } from "../lib/api";
import { clearAllSessionData, loadSession, saveSession } from "../lib/storage";

interface DemoContextValue {
  preferences: PreferencesState;
  setPreferences: (p: PreferencesState) => void;
  trustedCallers: TrustedCaller[];
  setTrustedCallers: (c: TrustedCaller[]) => void;
  callHistory: CallHistoryEntry[];
  addCallHistoryEntry: (entry: CallHistoryEntry) => void;
  demoStatus: DemoStatus;
  applyQuickMode: (mode: QuickMode) => void;
  resetDemo: () => void;
  deleteHistory: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<PreferencesState>(() =>
    loadSession("preferences", DEFAULT_PREFERENCES),
  );
  const [trustedCallers, setTrustedCallersState] = useState<TrustedCaller[]>(() =>
    loadSession("trustedCallers", TRUSTED_CALLERS),
  );
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>(() =>
    loadSession("callHistory", INITIAL_CALL_HISTORY),
  );
  const [demoStatus, setDemoStatus] = useState<DemoStatus>({
    mode: "simulation",
    azureOpenAIConfigured: false,
    azureSpeechConfigured: false,
    message: "Checking connected services…",
  });

  useEffect(() => {
    getDemoStatus().then(setDemoStatus);
  }, []);

  const setPreferences = useCallback((p: PreferencesState) => {
    setPreferencesState(p);
    saveSession("preferences", p);
  }, []);

  const setTrustedCallers = useCallback((c: TrustedCaller[]) => {
    setTrustedCallersState(c);
    saveSession("trustedCallers", c);
  }, []);

  const addCallHistoryEntry = useCallback((entry: CallHistoryEntry) => {
    setCallHistory((prev) => {
      const next = [entry, ...prev];
      saveSession("callHistory", next);
      return next;
    });
  }, []);

  const applyQuickMode = useCallback(
    (mode: QuickMode) => {
      const next: PreferencesState = { ...preferences, quickMode: mode };
      switch (mode) {
        case "available":
          next.availability = "available";
          break;
        case "focus":
          next.availability = "focus";
          break;
        case "quiet":
          next.availability = "quiet-hours";
          break;
        case "family-priority":
          next.availability = "available";
          next.callTypes = next.callTypes.map((r) =>
            ["family", "school", "healthcare"].includes(r.category) ? { ...r, action: "connect" } : r,
          );
          break;
        case "maximum-protection":
          next.availability = "do-not-disturb";
          next.suspiciousCalls = "block-and-alert";
          next.callTypes = next.callTypes.map((r) =>
            r.category === "family" ? r : { ...r, action: r.action === "connect" ? "ask" : r.action },
          );
          break;
      }
      setPreferences(next);
    },
    [preferences, setPreferences],
  );

  const resetDemo = useCallback(() => {
    clearAllSessionData();
    setPreferencesState(DEFAULT_PREFERENCES);
    setTrustedCallersState(TRUSTED_CALLERS);
    setCallHistory(INITIAL_CALL_HISTORY);
  }, []);

  const deleteHistory = useCallback(() => {
    setCallHistory([]);
    saveSession("callHistory", []);
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
      trustedCallers,
      setTrustedCallers,
      callHistory,
      addCallHistoryEntry,
      demoStatus,
      applyQuickMode,
      resetDemo,
      deleteHistory,
    }),
    [preferences, setPreferences, trustedCallers, setTrustedCallers, callHistory, addCallHistoryEntry, demoStatus, applyQuickMode, resetDemo, deleteHistory],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within a DemoProvider");
  return ctx;
}
