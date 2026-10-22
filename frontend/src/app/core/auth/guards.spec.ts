import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Role } from '@app/core/models/profile';
import { authGuard } from './auth.guard';
import { onboardingGuard } from './onboarding.guard';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { AuthUser } from './auth-user';

interface AuthStub {
  isDemo: () => boolean;
  isAuthenticated: () => boolean;
  role: () => Role | null;
  user?: () => AuthUser | null;
}

function authUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    email: 'teste@reviewit.demo',
    username: 'Teste',
    avatarUrl: null,
    role: 'Regular',
    status: 'Active',
    ...overrides,
  };
}

function configure(auth: AuthStub): Router {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  });

  return TestBed.inject(Router);
}

function routeWith(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
  return { data } as unknown as ActivatedRouteSnapshot;
}

function stateWith(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('allows demo mode without a backend session', () => {
    configure({ isDemo: () => true, isAuthenticated: () => false, role: () => null });

    const result = TestBed.runInInjectionContext(() =>
      authGuard(routeWith(), stateWith('/new')),
    );

    expect(result).toBe(true);
  });

  it('redirects to /login carrying the attempted url', () => {
    const router = configure({
      isDemo: () => false,
      isAuthenticated: () => false,
      role: () => null,
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard(routeWith(), stateWith('/new')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?next=%2Fnew');
  });

  it('allows an authenticated visitor', () => {
    configure({ isDemo: () => false, isAuthenticated: () => true, role: () => 'Regular' });

    const result = TestBed.runInInjectionContext(() =>
      authGuard(routeWith(), stateWith('/new')),
    );

    expect(result).toBe(true);
  });
});

describe('roleGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('allows a matching role', () => {
    configure({ isDemo: () => false, isAuthenticated: () => true, role: () => 'Admin' });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(routeWith({ roles: ['Admin'] satisfies Role[] }), stateWith('/moderation')),
    );

    expect(result).toBe(true);
  });

  it('redirects insufficient roles to the 403 page', () => {
    const router = configure({
      isDemo: () => false,
      isAuthenticated: () => true,
      role: () => 'Regular',
    });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(routeWith({ roles: ['Admin', 'Moderator'] }), stateWith('/moderation')),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/403');
  });

  it('sends unauthenticated visitors to /login', () => {
    const router = configure({
      isDemo: () => false,
      isAuthenticated: () => false,
      role: () => null,
    });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(routeWith({ roles: ['Admin'] }), stateWith('/moderation')),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/login?next=%2Fmoderation');
  });
});

describe('onboardingGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('redirects a user whose profile is missing', () => {
    const router = configure({
      isDemo: () => false,
      isAuthenticated: () => true,
      role: () => 'Regular',
      user: () => authUser({ needsProfile: true }),
    });

    const result = TestBed.runInInjectionContext(() =>
      onboardingGuard(routeWith(), stateWith('/new')),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/onboarding?next=%2Fnew');
  });

  it('redirects a user whose auto-created profile is not onboarded yet', () => {
    const router = configure({
      isDemo: () => false,
      isAuthenticated: () => true,
      role: () => 'Regular',
      user: () => authUser({ needsOnboarding: true }),
    });

    const result = TestBed.runInInjectionContext(() =>
      onboardingGuard(routeWith(), stateWith('/')),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/onboarding?next=%2F');
  });

  it('allows a completed profile', () => {
    configure({
      isDemo: () => false,
      isAuthenticated: () => true,
      role: () => 'Regular',
      user: () => authUser(),
    });

    const result = TestBed.runInInjectionContext(() =>
      onboardingGuard(routeWith(), stateWith('/')),
    );

    expect(result).toBe(true);
  });

  it('allows demo mode without a real session', () => {
    configure({
      isDemo: () => true,
      isAuthenticated: () => true,
      role: () => 'Admin',
      user: () => authUser(),
    });

    const result = TestBed.runInInjectionContext(() =>
      onboardingGuard(routeWith(), stateWith('/')),
    );

    expect(result).toBe(true);
  });
});
