import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Writes `dist/frontend/browser/config.json` after `ng build`, using the
 * hosting platform's environment variables. Run with `npm run build:deploy`.
 * Missing variables intentionally produce a blank config (demo mode).
 */
const output = fileURLToPath(new URL('../dist/frontend/browser/config.json', import.meta.url));

const clean = (value) => (value ?? '').trim();
const config = {
  apiBaseUrl: clean(process.env.REVIEWIT_API_URL).replace(/\/+$/, ''),
  supabaseUrl: clean(process.env.REVIEWIT_SUPABASE_URL),
  supabaseAnonKey: clean(process.env.REVIEWIT_SUPABASE_ANON_KEY),
};

writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Wrote ${output}`);
console.log(`apiBaseUrl: ${config.apiBaseUrl || '(fallback: /api/v1)'}`);
console.log(`supabase: ${config.supabaseUrl ? 'configured' : 'blank (demo mode)'}`);
