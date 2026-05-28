// Browser-side admin API client. The Nest backend is reached directly; the
// shared secret travels in the X-Admin-Token header (see lib/auth.ts).
import { getToken } from './auth';

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE}/api${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: 'no-store',
  });

  if (!res.ok) {
    let payload: unknown = undefined;
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    const message =
      (payload as { message?: string | string[] } | undefined)?.message;
    const text = Array.isArray(message) ? message.join(', ') : message ?? res.statusText;
    throw new ApiError(res.status, text, payload);
  }

  // 204 / empty
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/// Multipart file upload to the admin uploads endpoint. Returns the URL the
/// backend assigns the file (already absolute, ready to drop into a thumbnail
/// or product_images field).
export async function uploadFile(file: File): Promise<{
  url: string;
  size: number;
  mimetype: string;
}> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/admin/uploads`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    const message =
      (payload as { message?: string | string[] } | undefined)?.message ??
      res.statusText;
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(', ') : message,
      payload,
    );
  }
  return res.json();
}
