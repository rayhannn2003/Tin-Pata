/**
 * Tin Pata backend API configuration.
 *
 * The backend is the trusted server layer: it holds OPENAI_API_KEY, owns the AI
 * prompts, and enforces rate limits. The browser never calls OpenAI, and never sees
 * anything but this base URL.
 *
 * Ordinary RLS-protected CRUD and sync still go to Supabase directly — only the
 * operations that need a server secret are proxied through here.
 */

/** Base URL of the Tin Pata backend, e.g. `https://api.book.daftar-e.com`. */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

/** Absolute URL for a backend path. Empty string when the API is unconfigured. */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) return '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
