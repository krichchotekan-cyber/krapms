"use client";

import { StaffUser, UserSession } from "@/types/pms";

const SESSION_STORAGE_KEY = "hotel_pms_session_v2";
const SESSION_COOKIE_NAME = "hotel_pms_session";

/**
 * Detect client device information
 */
export function getClientDeviceInfo(): string {
  if (typeof window === "undefined" || !navigator) return "Unknown Device";
  const ua = navigator.userAgent;
  let os = "Desktop";
  if (/iPad|iPhone|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS X/.test(ua)) os = "macOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Linux/.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/Chrome/.test(ua) && !/Chromium|Edge|OPR/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Edge/.test(ua)) browser = "Edge";

  return `${os} • ${browser}`;
}

/**
 * Generate a unique cryptographically safe session token
 */
export function generateSessionToken(userId: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const userPart = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `sess_${userPart}_${timestamp}_${randomPart}`;
}

/**
 * Write session cookie for browser HTTP / server compatibility
 */
function setSessionCookie(token: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to set session cookie:", e);
  }
}

/**
 * Delete session cookie
 */
function clearSessionCookie() {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to clear session cookie:", e);
  }
}

/**
 * Create a new user session and persist to localStorage + cookie
 */
export function createSession(user: StaffUser, rememberMe = true, durationDays = 7): UserSession {
  const now = new Date();
  const days = rememberMe ? durationDays : 1;
  const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const token = generateSessionToken(user.id);

  const session: UserSession = {
    token,
    userId: user.id,
    user,
    loginAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    lastActiveAt: now.toISOString(),
    device: getClientDeviceInfo(),
    rememberMe,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      // Backward compatibility with legacy key
      localStorage.setItem("hotel_pms_user", JSON.stringify(user));
      setSessionCookie(token, days * 24 * 60 * 60);
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Failed to persist session to localStorage:", e);
    }
  }

  return session;
}

/**
 * Retrieve the current active session, verifying expiration
 */
export function getActiveSession(): UserSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      // Check legacy user item fallback
      const legacyRaw = localStorage.getItem("hotel_pms_user");
      if (legacyRaw && legacyRaw !== "LOGGED_OUT") {
        try {
          const user = JSON.parse(legacyRaw);
          if (user && user.id) {
            // Upgrade legacy user to formal session
            return createSession(user, true);
          }
        } catch {
          // invalid json
        }
      }
      return null;
    }

    const session: UserSession = JSON.parse(raw);
    if (!session || !session.token || !session.expiresAt) {
      destroySession();
      return null;
    }

    // Check expiration
    const expiresDate = new Date(session.expiresAt);
    if (expiresDate.getTime() <= Date.now()) {
      console.warn("[PMS Session] Session expired at", session.expiresAt);
      destroySession();
      return null;
    }

    return session;
  } catch (e) {
    console.error("Failed to parse active session:", e);
    destroySession();
    return null;
  }
}

/**
 * Update session lastActiveAt (heartbeat / sliding activity)
 */
export function updateSessionActivity(session: UserSession): UserSession {
  if (typeof window === "undefined") return session;
  try {
    const updated: UserSession = {
      ...session,
      lastActiveAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return session;
  }
}

/**
 * Update the user object within the current active session
 */
export function updateSessionUser(user: StaffUser): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    session.user = user;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem("hotel_pms_user", JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    return session;
  } catch (e) {
    console.error("Failed to update session user:", e);
    return null;
  }
}

/**
 * Terminate the session, wiping localStorage and cookie
 */
export function destroySession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.setItem("hotel_pms_user", "LOGGED_OUT");
    clearSessionCookie();
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to destroy session:", e);
  }
}
