import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  useMock: boolean;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  hasSupabase: boolean;
  pageSize: number;
}

const hasSupabase = Boolean(environment.supabaseUrl && environment.supabaseAnonKey);

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: (): AppConfig => ({
    useMock: environment.useMock || !hasSupabase,
    apiBaseUrl: environment.apiBaseUrl,
    supabaseUrl: environment.supabaseUrl,
    supabaseAnonKey: environment.supabaseAnonKey,
    hasSupabase,
    pageSize: environment.pageSize,
  }),
});
