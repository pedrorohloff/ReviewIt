import { inject } from '@angular/core';
import { NavigationError, RedirectCommand, Router } from '@angular/router';
import { ToasterService } from './services/toaster.service';

/**
 * Central navigation failure handler (lazy chunks, resolvers and guards).
 * It reports the failure with a toast and lands on the route-level error
 * screen, carrying the failed URL so the page can retry it.
 *
 * A failure while already on `/error` is ignored to avoid a redirect loop.
 */
export function handleNavigationError(error: NavigationError): RedirectCommand | undefined {
  if (error.url?.startsWith('/error')) {
    return undefined;
  }

  const router = inject(Router);
  const toaster = inject(ToasterService);
  const retry = error.url && error.url.startsWith('/') ? error.url : '/';

  toaster.error('Não foi possível abrir esta página.');

  return new RedirectCommand(
    router.parseUrl(`/error?retry=${encodeURIComponent(retry)}`),
    { replaceUrl: true },
  );
}
