import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '@app/core/api/api-error';
import { clearOAuthNext, readOAuthNext } from '@app/core/auth/app-token';
import { AuthService } from '@app/core/auth/auth.service';

type AuthMode = 'password' | 'register' | 'magic';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly mode = signal<AuthMode>('password');
  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(readOAuthError());

  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(64)]],
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(64)]],
  });

  protected readonly magicForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private readonly nextUrl = safeNextUrl(this.route.snapshot.queryParamMap.get('next'));
  private readonly storedNextUrl = readOAuthNext();

  constructor() {
    void this.auth.refreshGoogleAvailability();

    effect(() => {
      if (this.auth.isDemo() || !this.auth.isReady() || !this.auth.isAuthenticated()) {
        return;
      }

      const user = this.auth.user();
      const target = this.resolvedNextUrl();
      clearOAuthNext();

      if (user?.needsProfile || user?.needsOnboarding) {
        void this.router.navigate(['/onboarding'], {
          queryParams: { next: target },
        });
        return;
      }

      void this.router.navigateByUrl(target);
    });
  }

  protected setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.sent.set(false);
  }

  protected enterDemo(): void {
    this.auth.enterDemo();
    void this.router.navigateByUrl(this.resolvedNextUrl());
  }

  protected async submitPassword(): Promise<void> {
    if (this.passwordForm.invalid || this.submitting()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const { email, password } = this.passwordForm.getRawValue();
      await this.auth.signInWithPassword(email, password);
    } catch (error) {
      this.error.set(authErrorMessage(error, 'password'));
    } finally {
      this.submitting.set(false);
    }
  }

  protected async submitRegister(): Promise<void> {
    if (this.registerForm.invalid || this.submitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const { username, email, password } = this.registerForm.getRawValue();
      await this.auth.register(username, email, password);
    } catch (error) {
      this.error.set(authErrorMessage(error, 'register'));
    } finally {
      this.submitting.set(false);
    }
  }

  protected async submitMagicLink(): Promise<void> {
    if (this.magicForm.invalid || this.submitting()) {
      this.magicForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.auth.signInWithOtp(this.magicForm.controls.email.value);
      this.sent.set(true);
    } catch (error) {
      this.error.set(authErrorMessage(error, 'magic'));
    } finally {
      this.submitting.set(false);
    }
  }

  protected async signInWithGoogle(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.auth.signInWithGoogle(this.resolvedNextUrl());
    } catch (error) {
      this.error.set(authErrorMessage(error, 'google'));
      this.submitting.set(false);
    }
  }

  protected resetMagicLink(): void {
    this.sent.set(false);
    this.error.set(null);
  }

  private resolvedNextUrl(): string {
    return this.nextUrl !== '/' ? this.nextUrl : safeNextUrl(this.storedNextUrl);
  }
}

/** Only same-origin paths are accepted, so `?next=` cannot be an open redirect. */
function safeNextUrl(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }

  return '/';
}

function readOAuthError(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const params = new URLSearchParams(hash || window.location.search);
  const description = params.get('error_description') ?? params.get('error');

  return description ? 'Não foi possível entrar com o Google. Tente novamente.' : null;
}

function authErrorMessage(error: unknown, mode: AuthMode | 'google'): string {
  if (!(error instanceof ApiError)) {
    return 'Não foi possível concluir. Tente novamente.';
  }

  if (mode === 'password' && error.status === 401) {
    return 'E-mail ou senha incorretos.';
  }

  if (mode === 'register' && error.status === 409) {
    const detail = error.message.toLowerCase();

    if (detail.includes('email')) {
      return 'Este e-mail já está cadastrado.';
    }

    if (detail.includes('username')) {
      return 'Este nome de usuário já está em uso.';
    }

    return 'Não foi possível criar a conta com esses dados.';
  }

  if (mode === 'register' && error.status === 400) {
    return 'Confira os dados informados. A senha deve ter entre 10 e 64 caracteres.';
  }

  if (mode === 'magic') {
    if (/rate limit/i.test(error.message)) {
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    }

    return 'Não foi possível enviar o link. Tente novamente.';
  }

  if (mode === 'google' && /provider|oauth/i.test(error.message)) {
    return 'O login com Google ainda não está configurado.';
  }

  if (error.status === 403) {
    return 'Sua conta não está ativa.';
  }

  return error.message;
}
