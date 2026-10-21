import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toApiError } from '@app/core/api/api-error';
import { AuthService } from '@app/core/auth/auth.service';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { CommentStore } from './comment-store';

const MAX_LENGTH = 2000;

/**
 * Comment box. Clears only after the server confirms, so a failed submit keeps
 * the text (and the inline message) instead of losing the draft.
 */
@Component({
  selector: 'app-comment-composer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar],
  templateUrl: './comment-composer.html',
  styleUrl: './comment-composer.css',
})
export class CommentComposer {
  private readonly store = inject(CommentStore);
  private readonly auth = inject(AuthService);

  protected readonly maxLength = MAX_LENGTH;
  protected readonly draft = signal('');
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly user = this.auth.user;
  protected readonly signedIn = computed(() => !!this.auth.user());
  protected readonly placeholder = computed(() =>
    this.signedIn() ? 'Escreva um comentário…' : 'Entre para comentar.',
  );
  protected readonly counter = computed(() => `${this.draft().length}/${MAX_LENGTH}`);
  protected readonly canSubmit = computed(
    () =>
      this.signedIn() &&
      !this.pending() &&
      this.draft().trim().length > 0 &&
      this.draft().trim().length <= MAX_LENGTH,
  );

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
    this.error.set(null);
  }

  protected submit(event: Event): void {
    event.preventDefault();

    if (!this.canSubmit()) {
      return;
    }

    this.pending.set(true);
    this.error.set(null);

    this.store.create(this.draft().trim()).subscribe({
      next: () => {
        this.pending.set(false);
        this.draft.set('');
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.error.set(toApiError(error).message);
      },
    });
  }
}
