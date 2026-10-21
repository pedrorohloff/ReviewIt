import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '@app/core/models/profile';
import { AuthService } from './auth.service';

/**
 * Reads `route.data.roles` and compares it with the signed-in profile role.
 * Use it after `authGuard` so unauthenticated users are redirected first.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data?.['roles'] as Role[] | undefined;

  if (!auth.isAuthenticated() && !auth.isDemo()) {
    return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
  }

  const role = auth.role();
  if (!roles?.length || (role !== null && roles.includes(role))) {
    return true;
  }

  return router.createUrlTree(['/403']);
};
