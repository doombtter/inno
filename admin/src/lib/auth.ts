// Admin auth state in localStorage. JWT issued by the backend.
const TOKEN_KEY = 'inno_admin_token';
const USER_KEY = 'inno_admin_user';

export type Role = 'admin' | 'editor';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: AdminUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function hasToken(): boolean {
  return getToken() !== null;
}
