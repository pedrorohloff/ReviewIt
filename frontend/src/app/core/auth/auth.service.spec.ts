import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_CONFIG, AppConfig } from '@app/core/config/app-config';
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
