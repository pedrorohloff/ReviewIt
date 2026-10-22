import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Sends signed-in users without a profile, or with an untouched auto-created
 * profile, to the onboarding page before any app-shell route can load.
 *
 * Demo mode and anonymous visitors pass through: the demo identity is complete
 * and the login flow is handled by `authGuard` on protected routes.
 */
export const onboardingGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();

  if (auth.isDemo() || !user) {
    return true;
  }

  if (user.needsProfile || user.needsOnboarding) {
    return router.createUrlTree(['/onboarding'], { queryParams: { next: state.url } });
  }

  return true;
};
