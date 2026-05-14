import { decode as decodeBase64 } from 'base-64';

import { requireApiBaseUrl } from '../config';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${requireApiBaseUrl()}${path}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();

  let payload: Record<string, unknown> = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    // Backend returned non-JSON (HTML error page, Render startup page, proxy error).
    // Surface a readable message instead of crashing with "Unexpected character: <".
    throw new Error(
      `Server returned an unexpected response (status ${response.status}). ` +
      `Check that EXPO_PUBLIC_API_BASE_URL is correct and the backend is running.`
    );
  }

  if (!response.ok) {
    throw new Error(payload.error as string || `Request failed with status ${response.status}`);
  }
  return payload as T;
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const json = decodeBase64(padded);
  return JSON.parse(json);
}
