// Admin token lives in localStorage. No refresh, no expiry — the token is
// a static shared secret that the operator pastes once per device.
const KEY = 'inno_admin_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(KEY);
}

export function hasToken(): boolean {
  return getToken() !== null;
}
