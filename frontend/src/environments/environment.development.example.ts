/**
 * Copy this file to `environment.development.ts` before running `npm start`.
 * Leave `supabaseUrl` and `supabaseAnonKey` blank to use demo mode.
 * Never put a Supabase service-role key in the frontend.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  supabaseUrl: '',
  supabaseAnonKey: '',
  useMock: false,
  pageSize: 12,
} as const;
