import { TestBed } from '@angular/core/testing';
import { NavigationError, RedirectCommand, Router, provideRouter } from '@angular/router';
import { ToasterService } from './services/toaster.service';
import { handleNavigationError } from './navigation-error-handler';

function setup() {
  const toaster = { error: vi.fn() };

  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ToasterService, useValue: toaster }],
  });

  return { toaster, router: TestBed.inject(Router) };
}

function navigationError(url: string | null): NavigationError {
  return {
    id: 1,
    url,
    error: new Error('chunk failed'),
  } as NavigationError;
}

describe('handleNavigationError', () => {
  it('reports the failure and redirects to the error page with the failed URL', () => {
    const { toaster, router } = setup();

    const result = TestBed.runInInjectionContext(() =>
      handleNavigationError(navigationError('/posts/abc')),
    );

    expect(result).toBeInstanceOf(RedirectCommand);
    expect(router.serializeUrl((result as RedirectCommand).redirectTo)).toBe(
      '/error?retry=%2Fposts%2Fabc',
    );
    expect(toaster.error).toHaveBeenCalledWith('Não foi possível abrir esta página.');
  });

  it('falls back to the feed when the navigation has no URL', () => {
    const { router } = setup();

    const result = TestBed.runInInjectionContext(() => handleNavigationError(navigationError(null)));

    expect(router.serializeUrl((result as RedirectCommand).redirectTo)).toBe(
      '/error?retry=%2F',
    );
  });

  it('does not redirect again when the error page itself fails', () => {
    const { toaster } = setup();

    const result = TestBed.runInInjectionContext(() =>
      handleNavigationError(navigationError('/error?retry=%2Fposts')),
    );

    expect(result).toBeUndefined();
    expect(toaster.error).not.toHaveBeenCalled();
  });
});
