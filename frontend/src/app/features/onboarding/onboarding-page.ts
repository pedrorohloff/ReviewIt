import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { toApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { AuthService } from '@app/core/auth/auth.service';
import { ProfileInput } from '@app/core/models/profile';

/**
 * First-run profile completion. The Supabase trigger already creates a row so
 * the account is never blocked; this page turns that generated row into a
 * deliberate username/avatar choice before the user reaches the feed.
 */
@Component({
  selector: 'app-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './onboarding-page.html',
  styleUrl: './onboarding-page.css',
})
export class OnboardingPage {
  private readonly auth = inject(AuthService);
  private readonly api = inject<ReviewApi>(REVIEW_API);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    username: [
      this.auth.user()?.username ?? '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    avatarUrl: [this.auth.user()?.avatarUrl ?? '', [Validators.maxLength(500)]],
  });

  private readonly nextUrl = safeNextUrl(this.route.snapshot.queryParamMap.get('next'));

  constructor() {
    this.title.setTitle('Complete seu perfil · ReviewIt');

    effect(() => {
      if (!this.auth.isReady() || !this.auth.isAuthenticated()) {
        return;
      }

      const user = this.auth.user();
      if (user && !user.needsProfile && !user.needsOnboarding) {
        void this.router.navigateByUrl(this.nextUrl);
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.auth.user();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { next: this.nextUrl } });
      return;
    }

    const input: ProfileInput = {
      username: this.form.controls.username.value.trim(),
      avatarUrl: this.form.controls.avatarUrl.value.trim() || null,
    };

    this.saving.set(true);
    this.error.set(null);
    this.save(user.id, input, user.needsProfile === true);
  }

  protected signOut(): void {
    void this.auth.signOut();
  }

  private save(id: string, input: ProfileInput, create: boolean): void {
    const request = create
      ? this.api.createProfile(input)
      : this.api.updateProfile(id, input);

    request.subscribe({
      next: (profile) => {
        this.saving.set(false);
        this.auth.applyProfile(profile);
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);

        // A trigger may have created the row between the session fetch and
        // this POST. Retrying as an update finishes onboarding instead of
        // leaving the user stuck on a 409.
        if (create && apiError.status === 409) {
          this.save(id, input, false);
          return;
        }

        this.saving.set(false);
        this.error.set(apiError.fieldErrors['username'] ?? apiError.message);
      },
    });
  }
}

/** Only same-origin paths are accepted, so `?next=` cannot be an open redirect. */
function safeNextUrl(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }

  return '/';
}
