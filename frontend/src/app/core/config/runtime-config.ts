/**
 * Optional runtime configuration loaded from `/config.json` before Angular
 * bootstraps. Static hosts (Vercel/Netlify) can generate this file per
 * environment, so the same `dist/` works for demo, staging and production
 * without rebuilding and without committing environment-specific values.
 *
 * Every field is optional: blank or missing values fall back to
 * `environment.ts`, which keeps the local demo mode working.
 */
export interface RuntimeConfig {
  apiBaseUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const CONFIG_FILE = 'config.json';
const TIMEOUT_MS = 3000;

let runtimeConfig: RuntimeConfig = {};

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  runtimeConfig = {};

  if (typeof fetch !== 'function' || typeof document === 'undefined') {
    return runtimeConfig;
  }

  try {
    // Resolve against <base href> so sub-path deployments keep working.
    const response = await fetch(new URL(CONFIG_FILE, document.baseURI), {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return runtimeConfig;
    }

    const value: unknown = await response.json();
    if (isRuntimeConfig(value)) {
      runtimeConfig = value;
    }
  } catch {
    // Missing/invalid config is expected in demo mode; environment.ts remains
    // the fallback and the app still boots.
  }

  return runtimeConfig;
}

export function currentRuntimeConfig(): RuntimeConfig {
  return runtimeConfig;
}

function isRuntimeConfig(value: unknown): value is RuntimeConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ['apiBaseUrl', 'supabaseUrl', 'supabaseAnonKey'].every((key) => {
    const field = record[key];
    return field === undefined || typeof field === 'string';
  });
}
