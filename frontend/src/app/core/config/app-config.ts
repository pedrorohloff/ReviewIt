import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RuntimeConfig, currentRuntimeConfig } from './runtime-config';

export interface AppConfig {
  useMock: boolean;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  hasSupabase: boolean;
  pageSize: number;
}

/**
 * Merges `/config.json` over the build-time `environment.ts`. Runtime values
 * win only when non-blank, so developers can keep using
 * `environment.development.ts` locally.
 */
export function resolveConfig(runtime: RuntimeConfig = {}): AppConfig {
  const apiBaseUrl = normalizeBaseUrl(runtime.apiBaseUrl?.trim() || environment.apiBaseUrl);
  const supabaseUrl = runtime.supabaseUrl?.trim() || environment.supabaseUrl;
  const supabaseAnonKey = runtime.supabaseAnonKey?.trim() || environment.supabaseAnonKey;
  const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

  return {
    useMock: environment.useMock || !hasSupabase,
    apiBaseUrl,
    supabaseUrl,
    supabaseAnonKey,
    hasSupabase,
    pageSize: environment.pageSize,
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => resolveConfig(currentRuntimeConfig()),
});

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed || '/api/v1';
}
