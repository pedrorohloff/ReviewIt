import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Global "login required" gate for actions that need an account.
 *
 * The root component owns the dialog; any feature can call `requireLogin`
 * before navigating or mutating. Demo mode and signed-in users pass through,
 * so callers only need to handle the `false` return.
 */
@Injectable({ providedIn: 'root' })
export class LoginPromptService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _open = signal(false);
  private readonly _message = signal('Entre para continuar.');
  private readonly _next = signal<string | null>(null);

  readonly open = this._open.asReadonly();
  readonly message = this._message.asReadonly();

  /**
   * Opens the prompt for anonymous visitors.
   *
   * @returns `true` when the prompt was opened; `false` when the user can
   * proceed (authenticated or demo mode).
   */
  requireLogin(message: string, next = this.router.url): boolean {
    if (this.auth.isDemo() || this.auth.isAuthenticated()) {
      return false;
    }

    this._message.set(message);
    this._next.set(next);
    this._open.set(true);
    return true;
  }

  dismiss(): void {
    this._open.set(false);
  }

  async confirm(): Promise<void> {
    const next = this._next();
    this._open.set(false);

    await this.router.navigate(['/login'], {
      queryParams: next && next !== '/login' ? { next } : undefined,
    });
  }
}
