import { ApiError } from './apiError';
import type { ApiErrorBody } from './apiError';
import { tokenStorage } from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let refreshPromise: Promise<boolean> | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setOnUnauthenticated(handler: () => void) {
  onUnauthenticated = handler;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!res.ok) {
          tokenStorage.clear();
          return false;
        }
        const data = await res.json();
        tokenStorage.setAccess(data.accessToken);
        tokenStorage.setRefresh(data.refreshToken);
        return true;
      } catch {
        tokenStorage.clear();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: RequestOpts['query']): string {
  const url = new URL(BASE_URL.startsWith('http') ? `${BASE_URL}${path}` : `${window.location.origin}${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function doFetch(path: string, opts: RequestOpts, retried: boolean): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!opts.skipAuth) {
    const token = tokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (res.status === 401 && !opts.skipAuth && !retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return doFetch(path, opts, true);
    if (onUnauthenticated) onUnauthenticated();
  }
  return res;
}

export async function api<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const res = await doFetch(path, opts, false);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, body as ApiErrorBody | null);
  }
  return body as T;
}
