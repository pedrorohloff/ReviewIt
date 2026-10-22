import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { REVIEW_API } from '@app/core/api/review-api';
import { Profile, ProfileInput } from '@app/core/models/profile';

export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'notFound' | 'error';

/**
 * The profile being viewed (not the session user). Component-scoped with the
 * profile page, so opening another author never shows the previous header.
 */
@Injectable()
export class ProfileStore {
  private readonly api = inject(REVIEW_API);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _profile = signal<Profile | null>(null);
  private readonly _status = signal<ProfileStatus>('idle');
  private readonly _error = signal<ApiError | null>(null);

  private currentId: string | null = null;
  private request?: Subscription;

  readonly profile = this._profile.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  load(id: string): void {
    if (this.currentId !== id) {
      this.currentId = id;
      this._profile.set(null);
    }

    this.request?.unsubscribe();
    this._status.set('loading');
    this._error.set(null);

    this.request = this.api.getProfile(id).subscribe({
      next: (profile) => {
        this._profile.set(profile);
        this._status.set('ready');
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this._error.set(apiError);
        this._status.set(apiError.status === 404 ? 'notFound' : 'error');
      },
    });
  }

  retry(): void {
    if (this.currentId) {
      this.load(this.currentId);
    }
  }

  /** Adopts the PUT response without a second GET. */
  apply(profile: Profile): void {
    this._profile.set(profile);
    this._status.set('ready');
    this._error.set(null);
  }

  update(id: string, input: ProfileInput): Observable<Profile> {
    return this.api.updateProfile(id, input);
  }
}
