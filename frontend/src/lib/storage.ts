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

// Session identity is scoped per browser TAB (sessionStorage), not per browser
// profile (localStorage). If it were localStorage, opening a share link in a
// second tab of the same browser would silently reconnect as whichever seat
// that browser already holds -- there'd be no way to join as a second player
// without a different browser/incognito window. sessionStorage still survives
// a reload/reconnect within the same tab (the actual point of "reconnect"),
// it just doesn't leak into a fresh tab.
export function getStoredSession(): StoredSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
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
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(SESSION_KEY);
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
