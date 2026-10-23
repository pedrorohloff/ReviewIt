import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/auth/auth.service';

/**
 * Adds the current access token (local JWT or Supabase token) to backend
 * requests only. Auth calls that go straight to Supabase must stay untouched,
 * and login/registration must never carry a stale token.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();
  const isPublicAuthEndpoint =
    request.url.endsWith('/auth/login') || request.url.endsWith('/auth/register');

  if (!token || !auth.isApiRequest(request.url) || isPublicAuthEndpoint) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
