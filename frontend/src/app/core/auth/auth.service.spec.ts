import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { APP_CONFIG, AppConfig } from '@app/core/config/app-config';
import { Profile } from '@app/core/models/profile';
import { AppAuthResponse } from './app-auth-api';
import { APP_TOKEN_STORAGE_KEY } from './app-token';
import { AuthService } from './auth.service';
import { DEMO_USER } from './demo-user';

const demoConfig: AppConfig = {
  useMock: true,
  apiBaseUrl: '/api/v1',
  supabaseUrl: '',
  supabaseAnonKey: '',
  hasSupabase: false,
  pageSize: 12,
};

const supabaseConfig: AppConfig = {
  ...demoConfig,
  useMock: false,
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'publishable-key',
  hasSupabase: true,
};

/** Local auth only: keeps tests away from the real Supabase client. */
const localAuthConfig: AppConfig = {
  ...demoConfig,
  useMock: false,
  hasSupabase: false,
};

const profile: Profile = {
  id: '10000000-0000-4000-8000-000000000001',
  username: 'Ana',
  avatarUrl: null,
  role: 'Regular',
  status: 'Active',
  suspendedUntil: null,
  createdAt: '2026-01-01T00:00:00Z',
  onboarded: true,
};

function tokenWith(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function localToken(expiresInSeconds = 3_600): string {
  return tokenWith({
    sub: profile.id,
    email: 'ana@example.com',
    exp: Math.floor(Date.now() / 1_000) + expiresInSeconds,
  });
}

function authResponse(accessToken = localToken()): AppAuthResponse {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    email: 'ana@example.com',
    profile,
  };
}

describe('AuthService (demo mode)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: demoConfig },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('starts ready and signed in as the fixed demo user', () => {
    const auth = TestBed.inject(AuthService);

    expect(auth.isDemo()).toBe(true);
    expect(auth.isReady()).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()).toEqual(DEMO_USER);
    expect(auth.role()).toBe('Admin');
    expect(auth.accessToken()).toBeNull();
  });

  it('treats only backend URLs as API requests', () => {
    const auth = TestBed.inject(AuthService);

    expect(auth.isApiRequest('/api/v1/posts')).toBe(true);
    expect(auth.isApiRequest('https://example.supabase.co/auth/v1/token')).toBe(false);
  });

  it('mirrors an own-profile save and clears the onboarding flag', () => {
    const auth = TestBed.inject(AuthService);

    auth.applyProfile({
      id: DEMO_USER.id,
      username: 'Maria Atualizada',
      avatarUrl: 'https://example.com/maria.png',
      role: 'Admin',
      status: 'Active',
      suspendedUntil: null,
      createdAt: '2026-01-01T00:00:00Z',
      onboarded: true,
    });

    expect(auth.user()?.username).toBe('Maria Atualizada');
    expect(auth.user()?.avatarUrl).toBe('https://example.com/maria.png');
    expect(auth.user()?.needsProfile).toBe(false);
    expect(auth.user()?.needsOnboarding).toBe(false);
  });
});

describe('AuthService (Supabase unavailable)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: supabaseConfig },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('still becomes ready, signed out, when the auth chunk fails to load', async () => {
    const auth = TestBed.inject(AuthService);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    vi.spyOn(
      auth as unknown as { loadSupabaseModule: () => Promise<unknown> },
      'loadSupabaseModule',
    ).mockRejectedValue(new Error('chunk failed'));

    await auth.restoreSession();

    expect(auth.isReady()).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe('AuthService (Google availability)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: supabaseConfig },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('reports Google as available when Supabase enables it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ external: { google: true } }),
      }),
    );

    const auth = TestBed.inject(AuthService);

    await expect(auth.refreshGoogleAvailability()).resolves.toBe(true);
    expect(auth.googleEnabled()).toBe(true);
  });

  it('keeps Google hidden when the provider is disabled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ external: { google: false } }),
      }),
    );

    const auth = TestBed.inject(AuthService);

    await expect(auth.refreshGoogleAvailability()).resolves.toBe(false);
    expect(auth.googleEnabled()).toBe(false);
  });

  it('keeps Google hidden when the settings call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const auth = TestBed.inject(AuthService);

    await expect(auth.refreshGoogleAvailability()).resolves.toBe(false);
    expect(auth.googleEnabled()).toBe(false);
  });
});

describe('AuthService (local email/password)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: localAuthConfig },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('restores a stored JWT and the backend profile on boot', async () => {
    const token = localToken();
    localStorage.setItem(APP_TOKEN_STORAGE_KEY, token);

    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const restoring = auth.restoreSession();
    const request = http.expectOne(`/api/v1/profiles/${profile.id}`);
    expect(request.request.method).toBe('GET');
    request.flush(profile);
    await restoring;

    expect(auth.isReady()).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.username).toBe('Ana');
    expect(auth.user()?.email).toBe('ana@example.com');
    expect(auth.accessToken()).toBe(token);
  });

  it('clears an expired token instead of restoring it', async () => {
    localStorage.setItem(APP_TOKEN_STORAGE_KEY, localToken(-60));

    const auth = TestBed.inject(AuthService);
    await auth.restoreSession();

    expect(auth.isReady()).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(APP_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('clears a token whose profile is rejected by the API', async () => {
    localStorage.setItem(APP_TOKEN_STORAGE_KEY, localToken());

    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const restoring = auth.restoreSession();
    http
      .expectOne(`/api/v1/profiles/${profile.id}`)
      .flush(
        { title: 'Unauthorized', status: 401, detail: 'Invalid token' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await restoring;

    expect(auth.isReady()).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(APP_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('stores the JWT and user after a password login', async () => {
    const response = authResponse();
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const loggingIn = auth.signInWithPassword('ana@example.com', 'senha123456');
    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'ana@example.com',
      password: 'senha123456',
    });
    request.flush(response);
    await loggingIn;

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.username).toBe('Ana');
    expect(auth.accessToken()).toBe(response.accessToken);
    expect(localStorage.getItem(APP_TOKEN_STORAGE_KEY)).toBe(response.accessToken);
  });

  it('creates the account and stores the returned session', async () => {
    const response = authResponse();
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const registering = auth.register('Ana', 'ana@example.com', 'senha123456');
    const request = http.expectOne('/api/v1/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      username: 'Ana',
      email: 'ana@example.com',
      password: 'senha123456',
    });
    request.flush(response);
    await registering;

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.accessToken()).toBe(response.accessToken);
    expect(localStorage.getItem(APP_TOKEN_STORAGE_KEY)).toBe(response.accessToken);
  });

  it('clears the stored JWT on sign out', async () => {
    localStorage.setItem(APP_TOKEN_STORAGE_KEY, localToken());

    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const restoring = auth.restoreSession();
    http.expectOne(`/api/v1/profiles/${profile.id}`).flush(profile);
    await restoring;

    await auth.signOut();

    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(localStorage.getItem(APP_TOKEN_STORAGE_KEY)).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('clears the stored JWT when the API rejects the session', async () => {
    localStorage.setItem(APP_TOKEN_STORAGE_KEY, localToken());

    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const restoring = auth.restoreSession();
    http.expectOne(`/api/v1/profiles/${profile.id}`).flush(profile);
    await restoring;

    auth.onUnauthorized();

    expect(navigate).toHaveBeenCalled();
    expect(localStorage.getItem(APP_TOKEN_STORAGE_KEY)).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });
});
