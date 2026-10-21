import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { HttpReviewApi } from './core/api/http-review-api';
import { MockReviewApi } from './core/api/mock-review-api';
import { REVIEW_API } from './core/api/review-api';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { APP_CONFIG } from './core/config/app-config';
import { GlobalErrorHandler } from './core/error-handler';
import { problemInterceptor } from './core/http/problem.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    provideHttpClient(withInterceptors([authInterceptor, problemInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'disabled',
        anchorScrolling: 'enabled',
      }),
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    HttpReviewApi,
    {
      provide: REVIEW_API,
      useFactory: () => {
        const config = inject(APP_CONFIG);
        return config.useMock ? new MockReviewApi() : inject(HttpReviewApi);
      },
    },
  ],
};
