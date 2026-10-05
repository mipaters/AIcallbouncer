const STORAGE_PREFIX = "doorperson-ai-demo:";

export function loadSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveSession<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore storage errors (e.g., private browsing quota).
  }
}

export function clearAllSessionData(): void {
  try {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // Ignore storage errors.
  }
}
