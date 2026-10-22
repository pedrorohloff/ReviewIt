import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthService } from './auth.service';
import { moderatorGuard } from './moderator.guard';
import { Role } from '@app/core/models/profile';

function run(
  role: Role | null,
  options: { authenticated?: boolean; demo?: boolean } = {},
): ReturnType<CanActivateFn> {
  const { authenticated = true, demo = false } = options;

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          role: () => role,
          isAuthenticated: () => authenticated,
          isDemo: () => demo,
        },
      },
    ],
  });

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/moderation' } as RouterStateSnapshot;

  return TestBed.runInInjectionContext(() => moderatorGuard(route, state));
}

function urlOf(result: ReturnType<CanActivateFn>): string {
  if (result === true) {
    return 'allowed';
  }

  return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : 'redirect';
}

describe('moderatorGuard', () => {
  it('allows Admins and Moderators', () => {
    expect(run('Admin')).toBe(true);
    expect(run('Moderator')).toBe(true);
  });

  it('sends regular accounts to the 403 screen', () => {
    expect(urlOf(run('Regular'))).toBe('/403');
  });

  it('sends an authenticated account without a role to the 403 screen', () => {
    expect(urlOf(run(null))).toBe('/403');
  });

  it('sends signed-out visitors to the login page', () => {
    expect(urlOf(run(null, { authenticated: false }))).toBe('/login');
  });

  it('allows the demo identity, which is an Admin', () => {
    expect(run('Admin', { demo: true })).toBe(true);
  });
});
