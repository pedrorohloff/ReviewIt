import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Moderation console gate: only Moderator and Admin reach `/moderation`.
 * `authGuard` runs first; this guard still falls back to `/login` when used on
 * its own, and sends every other signed-in account to the 403 screen.
 */
export const moderatorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated() && !auth.isDemo()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.role();
  return role === 'Moderator' || role === 'Admin' ? true : router.createUrlTree(['/403']);
};
