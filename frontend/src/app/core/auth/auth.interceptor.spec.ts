import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const token = 'local-token';
  const auth = {
    accessToken: () => token,
    isApiRequest: (url: string) => url.startsWith('/api/v1'),
  };

  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the current token to API requests', () => {
    http.get('/api/v1/posts').subscribe();

    const request = controller.expectOne('/api/v1/posts');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    request.flush({});
  });

  it('does not send a stale token to login or registration', () => {
    http.post('/api/v1/auth/login', {}).subscribe();
    http.post('/api/v1/auth/register', {}).subscribe();

    for (const request of [
      controller.expectOne('/api/v1/auth/login'),
      controller.expectOne('/api/v1/auth/register'),
    ]) {
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    }
  });

  it('leaves non-API requests untouched', () => {
    http.get('/assets/config.json').subscribe();

    const request = controller.expectOne('/assets/config.json');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
