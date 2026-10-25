import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginPromptService } from './login-prompt.service';

interface AuthStub {
  isDemo: ReturnType<typeof signal<boolean>>;
  isAuthenticated: ReturnType<typeof signal<boolean>>;
}

function setup(auth: AuthStub) {
  const router = {
    url: '/posts/42',
    navigate: vi.fn().mockResolvedValue(true),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: Router, useValue: router },
    ],
  });

  return {
    prompt: TestBed.inject(LoginPromptService),
    router,
  };
}

describe('LoginPromptService', () => {
  it('opens for an anonymous visitor and keeps the attempted URL', () => {
    const { prompt } = setup({
      isDemo: signal(false),
      isAuthenticated: signal(false),
    });

    const opened = prompt.requireLogin('Entre para comentar.');

    expect(opened).toBe(true);
    expect(prompt.open()).toBe(true);
    expect(prompt.message()).toBe('Entre para comentar.');
  });

  it('does not open for an authenticated user', () => {
    const { prompt } = setup({
      isDemo: signal(false),
      isAuthenticated: signal(true),
    });

    const opened = prompt.requireLogin('Entre para comentar.');

    expect(opened).toBe(false);
    expect(prompt.open()).toBe(false);
  });

  it('does not open in demo mode', () => {
    const { prompt } = setup({
      isDemo: signal(true),
      isAuthenticated: signal(true),
    });

    expect(prompt.requireLogin('Entre para comentar.')).toBe(false);
    expect(prompt.open()).toBe(false);
  });

  it('dismisses without navigating', () => {
    const { prompt, router } = setup({
      isDemo: signal(false),
      isAuthenticated: signal(false),
    });

    prompt.requireLogin('Entre para comentar.');
    prompt.dismiss();

    expect(prompt.open()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to login with the attempted URL on confirm', async () => {
    const { prompt, router } = setup({
      isDemo: signal(false),
      isAuthenticated: signal(false),
    });

    prompt.requireLogin('Entre para criar uma review.', '/new');
    await prompt.confirm();

    expect(prompt.open()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { next: '/new' },
    });
  });
});
