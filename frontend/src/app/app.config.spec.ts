import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';
import { HttpReviewApi } from './core/api/http-review-api';
import { MockReviewApi } from './core/api/mock-review-api';
import { REVIEW_API } from './core/api/review-api';
import { APP_CONFIG, AppConfig } from './core/config/app-config';

const httpConfig: AppConfig = {
  useMock: false,
  apiBaseUrl: '/api/v1',
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'anon-key',
  hasSupabase: true,
  pageSize: 12,
};

describe('appConfig REVIEW_API selection', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('uses the mock adapter when Supabase is not configured', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    expect(TestBed.inject(REVIEW_API)).toBeInstanceOf(MockReviewApi);
  });

  it('uses the HTTP adapter when Supabase is configured', () => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        { provide: APP_CONFIG, useValue: httpConfig },
      ],
    });

    expect(TestBed.inject(REVIEW_API)).toBeInstanceOf(HttpReviewApi);
  });
});
