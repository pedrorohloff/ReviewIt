import { afterEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { resolveConfig } from './app-config';
import { loadRuntimeConfig } from './runtime-config';

describe('resolveConfig', () => {
  it('falls back to the build-time environment when runtime values are blank', () => {
    const config = resolveConfig({
      apiBaseUrl: '  ',
      supabaseUrl: '',
      supabaseAnonKey: '',
    });

    expect(config.apiBaseUrl).toBe(environment.apiBaseUrl);
    expect(config.useMock).toBe(true);
    expect(config.hasSupabase).toBe(false);
  });

  it('uses runtime Supabase values and enables the real API', () => {
    const config = resolveConfig({
      supabaseUrl: ' https://example.supabase.co ',
      supabaseAnonKey: ' anon-key ',
    });

    expect(config.supabaseUrl).toBe('https://example.supabase.co');
    expect(config.supabaseAnonKey).toBe('anon-key');
    expect(config.hasSupabase).toBe(true);
    expect(config.useMock).toBe(false);
  });

  it('normalizes the API base URL', () => {
    const config = resolveConfig({ apiBaseUrl: ' https://api.example.com/api/v1/ ' });

    expect(config.apiBaseUrl).toBe('https://api.example.com/api/v1');
  });

  it('never returns an empty API base URL', () => {
    const config = resolveConfig({ apiBaseUrl: '/' });

    expect(config.apiBaseUrl).toBe('/api/v1');
  });
});

describe('loadRuntimeConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and validates config.json without caching it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        apiBaseUrl: 'https://api.example.com/api/v1/',
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'anon-key',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadRuntimeConfig()).resolves.toEqual({
      apiBaseUrl: 'https://api.example.com/api/v1/',
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toContain('/config.json');
    expect(init.cache).toBe('no-store');
  });

  it('ignores non-OK responses and keeps the environment fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(loadRuntimeConfig()).resolves.toEqual({});
  });

  it('does not throw when config.json is missing or the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(loadRuntimeConfig()).resolves.toEqual({});
  });

  it('ignores payloads with the wrong field types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ apiBaseUrl: 42 }),
      }),
    );

    await expect(loadRuntimeConfig()).resolves.toEqual({});
  });
});
