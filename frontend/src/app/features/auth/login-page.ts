import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';

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

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private readonly nextUrl = safeNextUrl(this.route.snapshot.queryParamMap.get('next'));

  constructor() {
    effect(() => {
      if (this.auth.isDemo() || !this.auth.isReady() || !this.auth.isAuthenticated()) {
        return;
      }

      void this.router.navigateByUrl(this.nextUrl);
    });
  }

  protected enterDemo(): void {
    this.auth.enterDemo();
    void this.router.navigateByUrl(this.nextUrl);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.sending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.error.set(null);

    try {
      await this.auth.signInWithOtp(this.form.controls.email.value);
      this.sent.set(true);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Não foi possível enviar o link. Tente novamente.',
      );
    } finally {
      this.sending.set(false);
    }
  }

  protected reset(): void {
    this.sent.set(false);
    this.error.set(null);
  }
}

/** Only same-origin paths are accepted, so `?next=` cannot be an open redirect. */
function safeNextUrl(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }

  return '/';
}
