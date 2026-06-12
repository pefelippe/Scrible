// Client-side session handling: persists the JWT + user in localStorage and
// notifies the app when the session changes (login/logout/401).
import type { AuthUser } from '@/types';

const TOKEN_KEY = 'scribe.token';
const USER_KEY = 'scribe.user';

type SessionListener = () => void;
const listeners = new Set<SessionListener>();

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

let _cachedUserRaw: string | null = undefined as unknown as null;
let _cachedUser: AuthUser | null = null;

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (raw !== _cachedUserRaw) {
    _cachedUserRaw = raw;
    _cachedUser = raw ? (JSON.parse(raw) as AuthUser) : null;
  }
  return _cachedUser;
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  listeners.forEach((listener) => listener());
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  listeners.forEach((listener) => listener());
}

export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
