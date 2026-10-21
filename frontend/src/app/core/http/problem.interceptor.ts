import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { toApiError } from '@app/core/api/api-error';
import { AuthService } from '@app/core/auth/auth.service';
import { ToasterService } from '@app/core/services/toaster.service';

/**
 * Maps RFC 7807 responses to `ApiError`, reacts to 401 and surfaces only
 * unexpected failures (network/5xx) as toasts. Domain failures stay inline.
 */
export const problemInterceptor: HttpInterceptorFn = (request, next) => {
  const toaster = inject(ToasterService);
  const auth = inject(AuthService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const apiError = toApiError(error);

      if (apiError.status === 401) {
        auth.onUnauthorized();
      } else if (apiError.status === 0 || apiError.status >= 500) {
        toaster.error(apiError.message);
      }

      return throwError(() => apiError);
    }),
  );
};
