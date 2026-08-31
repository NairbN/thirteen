const SESSION_KEY = "thirteen:session";
const PROFILE_KEY = "thirteen:profile";

export interface StoredSession {
  code: string;
  sessionToken: string;
  seatIndex: number;
}

export interface StoredProfile {
  username: string;
  icon: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStoredSession(): StoredSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.code !== "string" || typeof parsed.sessionToken !== "string") return null;
    return {
      code: parsed.code,
      sessionToken: parsed.sessionToken,
      seatIndex: typeof parsed.seatIndex === "number" ? parsed.seatIndex : -1,
    };
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getStoredProfile(): StoredProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredProfile>;
    if (typeof parsed.username !== "string" || typeof parsed.icon !== "string") return null;
    return { username: parsed.username, icon: parsed.icon };
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: StoredProfile): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
