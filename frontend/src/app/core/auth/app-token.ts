export const APP_TOKEN_STORAGE_KEY = 'reviewit.auth.token';
const OAUTH_NEXT_KEY = 'reviewit.auth.oauth-next';

/**
 * Local email/password sessions are stored in `localStorage`, following the
 * same pattern already used for the Supabase session. A failure to access
 * storage (private mode, blocked storage) simply degrades to a memory-only
 * session for the current tab.
 */
export function readAppToken(): string | null {
  try {
    return localStorage.getItem(APP_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeAppToken(token: string): void {
  try {
    localStorage.setItem(APP_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures; the in-memory signal still works.
  }
}

export function clearAppToken(): void {
  try {
    localStorage.removeItem(APP_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

/** Keeps the post-login destination across the Google OAuth redirect. */
export function writeOAuthNext(next: string): void {
  try {
    sessionStorage.setItem(OAUTH_NEXT_KEY, next);
  } catch {
    // Ignore storage failures.
  }
}

export function readOAuthNext(): string | null {
  try {
    return sessionStorage.getItem(OAUTH_NEXT_KEY);
  } catch {
    return null;
  }
}

export function clearOAuthNext(): void {
  try {
    sessionStorage.removeItem(OAUTH_NEXT_KEY);
  } catch {
    // Ignore storage failures.
  }
}
