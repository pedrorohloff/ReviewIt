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
});
